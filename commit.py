import subprocess
import os

# Custom date (format: "YYYY-MM-DD HH:MM:SS")
custom_date = "2026-03-28 21:23:00"

# Set environment variables for Git
env = os.environ.copy()
env["GIT_AUTHOR_DATE"] = custom_date
env["GIT_COMMITTER_DATE"] = custom_date

# Add files
subprocess.run(["git", "add", "."], env=env)

# Commit with custom date
subprocess.run(
    ["git", "commit", "-m", "Created club invite function"],
    env=env
)