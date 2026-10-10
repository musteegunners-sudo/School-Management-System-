import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Student, SchoolClass, Term, AcademicSession } from '../types';
import {
  Calendar,
  Users,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowUpDown,
  TrendingUp,
  Info,
  CheckCircle2,
} from 'lucide-react';

export interface HeatmapStudentRow {
  student: Student;
  weeklyAttendance: number[]; // 12 values, 0-5
  unitAttendanceTotal: number; // 0-60
  timesOpened: number;
  timesPresent: number | string;
  timesAbsent: number;
}

interface AttendanceHeatmapD3Props {
  selectedClass?: SchoolClass;
  records: HeatmapStudentRow[];
  currentTerm: Term;
  currentSession: AcademicSession;
  termDaysOpened: number;
  onStudentClick?: (studentId: string) => void;
}

type SortOption = 'lowest_attendance' | 'highest_attendance' | 'name_asc';

export const AttendanceHeatmapD3: React.FC<AttendanceHeatmapD3Props> = ({
  selectedClass,
  records,
  currentTerm,
  currentSession,
  termDaysOpened,
  onStudentClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [sortOption, setSortOption] = useState<SortOption>('lowest_attendance');
  const [showValuesInCells, setShowValuesInCells] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<{
    studentName: string;
    regNo: string;
    weekIndex: number;
    days: number;
    percent: number;
    x: number;
    y: number;
  } | null>(null);

  // Sort records based on user selection
  const sortedRecords = useMemo(() => {
    const list = [...records];
    if (sortOption === 'lowest_attendance') {
      return list.sort((a, b) => a.unitAttendanceTotal - b.unitAttendanceTotal);
    }
    if (sortOption === 'highest_attendance') {
      return list.sort((a, b) => b.unitAttendanceTotal - a.unitAttendanceTotal);
    }
    if (sortOption === 'name_asc') {
      return list.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
    }
    return list;
  }, [records, sortOption]);

  // Aggregate weekly class averages (Week 1 to Week 12)
  const weeklyClassStats = useMemo(() => {
    return Array.from({ length: 12 }).map((_, wIdx) => {
      if (records.length === 0) return { week: wIdx + 1, avgDays: 0, percentage: 0 };
      const totalDays = records.reduce((acc, r) => acc + (r.weeklyAttendance[wIdx] || 0), 0);
      const avgDays = totalDays / records.length;
      const percentage = Math.round((avgDays / 5) * 100);
      return {
        week: wIdx + 1,
        avgDays: Number(avgDays.toFixed(1)),
        percentage,
      };
    });
  }, [records]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (records.length === 0) {
      return {
        classAveragePercent: 0,
        perfectCount: 0,
        atRiskCount: 0,
        bestWeek: 1,
        bestWeekPercent: 0,
      };
    }

    const totalPossibleDays = records.length * 60; // 12 weeks * 5 days = 60 days
    const totalRecordedDays = records.reduce((acc, r) => acc + r.unitAttendanceTotal, 0);
    const classAveragePercent = totalPossibleDays > 0 ? Math.round((totalRecordedDays / totalPossibleDays) * 100) : 0;

    const perfectCount = records.filter((r) => r.unitAttendanceTotal >= 60).length;
    const atRiskCount = records.filter((r) => {
      const pct = (r.unitAttendanceTotal / 60) * 100;
      return pct < 75;
    }).length;

    let bestWeek = 1;
    let bestWeekPercent = -1;
    weeklyClassStats.forEach((w) => {
      if (w.percentage > bestWeekPercent) {
        bestWeekPercent = w.percentage;
        bestWeek = w.week;
      }
    });

    return {
      classAveragePercent,
      perfectCount,
      atRiskCount,
      bestWeek,
      bestWeekPercent: Math.max(0, bestWeekPercent),
    };
  }, [records, weeklyClassStats]);

  // D3 Color Interpolator / Scale
  // 0 days: Crimson/Rose (#e11d48)
  // 1 day: Orange (#f97316)
  // 2 days: Amber (#f59e0b)
  // 3 days: Lime/Yellow-Green (#84cc16)
  // 4 days: Mint/Teal (#0d9488)
  // 5 days: Dark Emerald (#047857)
  const colorScale = useMemo(() => {
    return d3
      .scaleLinear<string>()
      .domain([0, 1, 2, 3, 4, 5])
      .range(['#fee2e2', '#fed7aa', '#fef08a', '#d9f99d', '#6ee7b7', '#047857']);
  }, []);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    if (sortedRecords.length === 0) {
      return;
    }

    const containerWidth = container.clientWidth || 900;
    const labelWidth = Math.min(220, Math.max(160, containerWidth * 0.24));
    const margin = { top: 75, right: 30, bottom: 40, left: labelWidth };
    const availableWidth = Math.max(500, containerWidth - margin.left - margin.right);

    const numWeeks = 12;
    const numStudents = sortedRecords.length;

    const cellWidth = Math.floor(availableWidth / numWeeks);
    const cellHeight = 28;
    const innerWidth = cellWidth * numWeeks;
    const innerHeight = cellHeight * numStudents;

    const width = innerWidth + margin.left + margin.right;
    const height = innerHeight + margin.top + margin.bottom;

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto; font-family: inherit;');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Top Header: Week labels and Class Average mini badges
    const headerGroup = g.append('g').attr('class', 'headers');

    for (let w = 0; w < numWeeks; w++) {
      const colX = w * cellWidth;
      const weekStat = weeklyClassStats[w] || { percentage: 0 };

      const colHeader = headerGroup
        .append('g')
        .attr('transform', `translate(${colX}, -60)`);

      // Week Title
      colHeader
        .append('text')
        .attr('x', cellWidth / 2)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('fill', '#0f172a')
        .text(`U${w + 1}`);

      // Subtitle (0-5d)
      colHeader
        .append('text')
        .attr('x', cellWidth / 2)
        .attr('y', 27)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#64748b')
        .text('Unit');

      // Class Attendance % Pill
      const pillColor =
        weekStat.percentage >= 85
          ? '#059669'
          : weekStat.percentage >= 65
          ? '#d97706'
          : '#e11d48';

      const pillG = colHeader
        .append('g')
        .attr('transform', `translate(${cellWidth / 2 - 19}, 34)`);

      pillG
        .append('rect')
        .attr('width', 38)
        .attr('height', 17)
        .attr('rx', 8)
        .attr('fill', pillColor)
        .attr('opacity', 0.12);

      pillG
        .append('rect')
        .attr('width', 38)
        .attr('height', 17)
        .attr('rx', 8)
        .attr('fill', 'none')
        .attr('stroke', pillColor)
        .attr('stroke-width', 1)
        .attr('opacity', 0.35);

      pillG
        .append('text')
        .attr('x', 19)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', pillColor)
        .text(`${weekStat.percentage}%`);
    }

    // Heatmap Rows (Students)
    sortedRecords.forEach((record, sIdx) => {
      const rowY = sIdx * cellHeight;
      const rowG = g.append('g').attr('transform', `translate(0, ${rowY})`);

      // Alternating background stripe for readability
      if (sIdx % 2 === 1) {
        rowG
          .append('rect')
          .attr('x', -margin.left + 8)
          .attr('y', 0)
          .attr('width', innerWidth + margin.left - 8)
          .attr('height', cellHeight)
          .attr('fill', '#f8fafc')
          .attr('opacity', 0.6);
      }

      // Student Row Label (Student Name + Reg No)
      const labelG = rowG
        .append('g')
        .attr('transform', `translate(${-12}, ${cellHeight / 2})`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          if (onStudentClick) onStudentClick(record.student.id);
        });

      // Student Rank / Number
      labelG
        .append('text')
        .attr('x', -margin.left + 22)
        .attr('y', 4)
        .attr('text-anchor', 'start')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(`${sIdx + 1}.`);

      // Student Name
      const nameText =
        record.student.fullName.length > 20
          ? `${record.student.fullName.substring(0, 18)}...`
          : record.student.fullName;

      labelG
        .append('text')
        .attr('x', -margin.left + 44)
        .attr('y', 4)
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#1e293b')
        .text(nameText);

      // Student Reg No (on hover or secondary)
      const pct = Math.round((record.unitAttendanceTotal / 60) * 100);
      labelG
        .append('text')
        .attr('x', -10)
        .attr('y', 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', pct >= 85 ? '#047857' : pct >= 65 ? '#b45309' : '#e11d48')
        .text(`${pct}%`);

      // Cells across 12 Weeks
      record.weeklyAttendance.forEach((days, wIdx) => {
        const cellX = wIdx * cellWidth;
        const cellG = rowG.append('g').attr('transform', `translate(${cellX}, 0)`);

        const fillColor = colorScale(days);
        const isFull = days === 5;
        const isZero = days === 0;

        const rect = cellG
          .append('rect')
          .attr('x', 2)
          .attr('y', 2)
          .attr('width', cellWidth - 4)
          .attr('height', cellHeight - 4)
          .attr('rx', 4)
          .attr('fill', fillColor)
          .attr('stroke', '#e2e8f0')
          .attr('stroke-width', 1)
          .attr('cursor', 'pointer')
          .style('transition', 'all 0.15s ease-in-out');

        // Hover effect using D3
        cellG
          .on('mouseenter', (event) => {
            rect
              .attr('stroke', '#047857')
              .attr('stroke-width', 2)
              .attr('transform', 'scale(1.05)')
              .attr('transform-origin', `${cellWidth / 2}px ${cellHeight / 2}px`);

            const bounds = container.getBoundingClientRect();
            setHoveredCell({
              studentName: record.student.fullName,
              regNo: record.student.regNo,
              weekIndex: wIdx + 1,
              days,
              percent: Math.round((days / 5) * 100),
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
            });
          })
          .on('mouseleave', () => {
            rect
              .attr('stroke', '#e2e8f0')
              .attr('stroke-width', 1)
              .attr('transform', 'scale(1)');

            setHoveredCell(null);
          });

        // Numeric text inside cell
        if (showValuesInCells) {
          cellG
            .append('text')
            .attr('x', cellWidth / 2)
            .attr('y', cellHeight / 2 + 3.5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', isFull ? '700' : '600')
            .attr('fill', isFull ? '#ffffff' : isZero ? '#991b1b' : '#1e293b')
            .attr('pointer-events', 'none')
            .text(`${days}d`);
        }
      });
    });

    // Outer subtle boundary border
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('rx', 4);
  }, [sortedRecords, weeklyClassStats, colorScale, showValuesInCells, onStudentClick]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Banner with Islamic Kulliyyat Aesthetics */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>D3 Attendance Pattern Heatmap</span>
              <span>•</span>
              <span>{currentTerm.name}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{selectedClass ? selectedClass.name : 'Class'} Attendance Heatmap</span>
              {selectedClass?.section && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-emerald-200 font-medium">
                  Section: {selectedClass.section}
                </span>
              )}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
              D3.js visualization tracking student attendance consistency across 12 academic curriculum units (Unit by unit). Identify attendance deficits, unit cohort patterns, and intervention needs in real time.
            </p>
          </div>

          {/* KPI Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 self-start sm:self-auto">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-200 block font-medium">Term Attendance</span>
              <span className="text-base font-bold text-white">{summaryMetrics.classAveragePercent}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-200 block font-medium">Best Unit</span>
              <span className="text-base font-bold text-emerald-300">
                Unit {summaryMetrics.bestWeek} ({summaryMetrics.bestWeekPercent}%)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] text-rose-200 block font-medium">At-Risk (&lt;75%)</span>
              <span className="text-base font-bold text-rose-300">
                {summaryMetrics.atRiskCount} Student{summaryMetrics.atRiskCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Controls Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Controller */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Sort By:</span>
            <select
              id="select-heatmap-sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="lowest_attendance">⚠️ Lowest Attendance First (Intervention)</option>
              <option value="highest_attendance">⭐ Highest Attendance First (Excellence)</option>
              <option value="name_asc">🔤 Student Name (A - Z)</option>
            </select>
          </div>

          {/* Toggle Values in Cells */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showValuesInCells}
              onChange={(e) => setShowValuesInCells(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="font-medium">Show Day Values (e.g. 5d)</span>
          </label>
        </div>

        {/* D3 Heatmap Color Scale Legend */}
        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="font-semibold text-slate-700">Attendance Intensity:</span>
          <div className="flex items-center gap-1 font-mono">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-xs bg-[#fee2e2] border border-slate-200 flex items-center justify-center text-[9px] font-bold text-rose-800">
                0
              </span>
              <span className="text-[10px] text-slate-500">0d</span>
            </div>
            <div className="w-3 h-3 rounded-xs bg-[#fed7aa] border border-slate-200" title="1 Day" />
            <div className="w-3 h-3 rounded-xs bg-[#fef08a] border border-slate-200" title="2 Days" />
            <div className="w-3 h-3 rounded-xs bg-[#d9f99d] border border-slate-200" title="3 Days" />
            <div className="w-3 h-3 rounded-xs bg-[#6ee7b7] border border-slate-200" title="4 Days" />
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-xs bg-[#047857] border border-emerald-800 flex items-center justify-center text-[9px] font-bold text-white">
                5
              </span>
              <span className="text-[10px] text-slate-500">5d (Full)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="p-4 sm:p-6 overflow-x-auto relative" ref={containerRef}>
        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No students enrolled in this class.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Enroll students in Student Registration to view the D3 attendance heatmap.
            </p>
          </div>
        ) : (
          <div className="min-w-[820px]">
            <svg ref={svgRef} className="block mx-auto" />
          </div>
        )}

        {/* Floating Interactive Tooltip */}
        {hoveredCell && (
          <div
            ref={tooltipRef}
            style={{
              left: Math.min(
                (containerRef.current?.clientWidth || 800) - 220,
                Math.max(10, hoveredCell.x + 15)
              ),
              top: Math.max(10, hoveredCell.y - 80),
            }}
            className="absolute z-30 pointer-events-none p-3 rounded-xl bg-slate-900/95 text-white shadow-xl border border-slate-700 text-xs w-52 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="font-bold text-white border-b border-slate-700 pb-1 mb-1.5 truncate">
              {hoveredCell.studentName}
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>Admission No:</span>
                <span className="font-mono text-emerald-300 font-semibold">{hoveredCell.regNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Week of Term:</span>
                <span className="font-semibold text-white">Week {hoveredCell.weekIndex}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span>Days Attended:</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    hoveredCell.days === 5
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : hoveredCell.days >= 3
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {hoveredCell.days} of 5 days ({hoveredCell.percent}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Footer Legend & Administrative Note */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>
            Pills at the top column header represent the overall class attendance rate for each academic week.
          </span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <span>{records.length} Students tracked</span>
          <span>•</span>
          <span>12 Academic Units (60 Days Max)</span>
        </div>
      </div>
    </div>
  );
};
