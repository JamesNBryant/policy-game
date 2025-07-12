#!/usr/bin/env bash
set -euo pipefail
infile="repo.md"

inside=0
filepath=""

while IFS='' read -r line; do
  if [[ $inside -eq 0 && $line != \`\`\`* && $line == */* ]]; then
    filepath="$line"
    mkdir -p "$(dirname "$filepath")"
    inside=1              # next line will be ```lang
    continue
  fi

  if [[ $inside -eq 1 ]]; then            # expecting opening ```
    inside=2
    >"$filepath"                          # truncate / create file
    continue
  fi

  if [[ $inside -eq 2 ]]; then
    if [[ $line == \`\`\`* ]]; then
      inside=0                            # closing fence
    else
      printf '%s\n' "$line" >> "$filepath"
    fi
  fi
done < "$infile"

echo "✅ Files extracted."
#!/usr/bin/env bash
set -e
infile="repo.md"

awk '
  /^[^`].*\/.*$/ {
    path=$0
    cmd="mkdir -p \"" substr(path,1,index(path,\"/\")-1) "\""
    system(cmd)
    getline
    if ($0 ~ /^```/) { lang=$0 }
    outfile=path
    while (getline && $0 !~ /^```/) {
      print $0 > outfile
    }
  }
' "$infile"
echo "✅ Files extracted."


