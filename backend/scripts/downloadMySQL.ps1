$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$localRoot = Join-Path $projectRoot '.local'
$mysqlRoot = Join-Path $localRoot 'mysql'
$archive = Join-Path $localRoot 'mysql-8.4.8.zip'
New-Item -ItemType Directory -Path $localRoot -Force | Out-Null
if (-not (Test-Path -LiteralPath $archive)) {
    curl.exe --fail --location --retry 2 --silent --show-error 'https://cdn.mysql.com/archives/mysql-8.4/mysql-8.4.8-winx64.zip' --output $archive
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo descargar MySQL oficial.' }
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
    foreach ($entry in $zip.Entries) {
        if ($entry.FullName -notmatch '^mysql-8\.4\.8-winx64/(bin|lib|share)/' -or $entry.FullName.EndsWith('/')) { continue }
        $relative = $entry.FullName.Substring('mysql-8.4.8-winx64/'.Length)
        $destination = [IO.Path]::GetFullPath((Join-Path $mysqlRoot $relative))
        if (-not $destination.StartsWith($mysqlRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta ZIP invalida.' }
        New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destination)) -Force | Out-Null
        [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
    }
} finally { $zip.Dispose() }
Write-Output 'MySQL Community 8.4.8 oficial preparado dentro del proyecto.'
