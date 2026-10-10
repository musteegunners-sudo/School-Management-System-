#!/usr/bin/env python3
import os
import zipfile
import sys

def create_project_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    public_dir = os.path.join(base_dir, "public")
    os.makedirs(public_dir, exist_ok=True)
    
    zip_filename = os.path.join(public_dir, "kulliyyat-tatbiq-complete-system.zip")
    root_zip_filename = os.path.join(base_dir, "kulliyyat-tatbiq-complete-system.zip")
    
    # Exclude directories and large cache folders
    excluded_dirs = {
        "node_modules",
        ".git",
        "dist",
        ".vite",
        "__pycache__",
        ".cache",
    }
    
    excluded_files = {
        "kulliyyat-tatbiq-complete-system.zip",
        ".DS_Store",
    }

    print(f"Creating project ZIP archive from: {base_dir}")
    
    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.startswith(".git")]
            
            for f in files:
                if f in excluded_files:
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                
                # Do not zip the target zip if inside public
                if rel_path.endswith("kulliyyat-tatbiq-complete-system.zip"):
                    continue
                    
                zf.write(full_path, arcname=os.path.join("kulliyyat-tatbiq-system", rel_path))
                
    # Also copy or create link in root for convenience
    import shutil
    shutil.copy2(zip_filename, root_zip_filename)
    
    size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
    print(f"Successfully generated ZIP: {zip_filename} ({size_mb:.2f} MB)")
    print(f"Also copied to root: {root_zip_filename}")

if __name__ == "__main__":
    create_project_zip()
