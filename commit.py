import subprocess
import os

# Custom date (format: "YYYY-MM-DD HH:MM:SS")
custom_date = "2026-04-01 11:18:26"

# Set environment variables for Git
env = os.environ.copy()
env["GIT_AUTHOR_DATE"] = custom_date
env["GIT_COMMITTER_DATE"] = custom_date

# Add files
subprocess.run(["git", "add", "."], env=env)

# Commit with custom date
subprocess.run(
    ["git", "commit", "-m", "Fixed Messaging page"],
    env=env
)