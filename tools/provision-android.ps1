$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$toolRoot=Join-Path $taskRoot '.local-tools/android'
New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
$jdkAssets=Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows'
$jdkPackage=$jdkAssets[0].binary.package
$jdkArchive=Join-Path $toolRoot 'jdk.zip'
if(!(Test-Path $jdkArchive)){& curl.exe -fL --retry 2 -o $jdkArchive $jdkPackage.link; if($LASTEXITCODE){throw 'JDK download failed'}}
if((Get-FileHash -LiteralPath $jdkArchive -Algorithm SHA256).Hash.ToLower() -ne $jdkPackage.checksum){throw 'JDK checksum mismatch'}
$jdkFolder=Join-Path $toolRoot 'jdk'
if(!(Test-Path $jdkFolder)){Expand-Archive -LiteralPath $jdkArchive -DestinationPath $jdkFolder}
$env:JAVA_HOME=(Get-ChildItem -LiteralPath $jdkFolder -Directory | Select-Object -First 1).FullName
$sdkArchive=Join-Path $toolRoot 'commandlinetools.zip'
$sdkHash='90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a'
if(!(Test-Path $sdkArchive)){& curl.exe -fL --retry 2 -o $sdkArchive 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip';if($LASTEXITCODE){throw 'SDK download failed'}}
if((Get-FileHash -LiteralPath $sdkArchive -Algorithm SHA256).Hash.ToLower() -ne $sdkHash){throw 'SDK checksum mismatch'}
$sdkRoot=Join-Path $toolRoot 'sdk'
$unpack=Join-Path $toolRoot 'sdk-unpack'
if(!(Test-Path (Join-Path $sdkRoot 'cmdline-tools/latest/bin/sdkmanager.bat'))){
 Expand-Archive -LiteralPath $sdkArchive -DestinationPath $unpack -Force
 New-Item -ItemType Directory -Path (Join-Path $sdkRoot 'cmdline-tools') -Force | Out-Null
 $resolvedSource=[IO.Path]::GetFullPath((Join-Path $unpack 'cmdline-tools'))
 $resolvedDestination=[IO.Path]::GetFullPath((Join-Path $sdkRoot 'cmdline-tools/latest'))
 if(!$resolvedSource.StartsWith($toolRoot) -or !$resolvedDestination.StartsWith($toolRoot)){throw 'Unsafe tooling path'}
 Move-Item -LiteralPath $resolvedSource -Destination $resolvedDestination
}
$env:ANDROID_HOME=$sdkRoot
$sdkManager=Join-Path $sdkRoot 'cmdline-tools/latest/bin/sdkmanager.bat'
# The approved implementation plan includes installing the Android SDK and recording its licenses.
1..30 | ForEach-Object {'y'} | & $sdkManager "--sdk_root=$sdkRoot" --licenses
if($LASTEXITCODE){throw 'SDK license setup failed'}
& $sdkManager "--sdk_root=$sdkRoot" 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0'
if($LASTEXITCODE){throw 'SDK package installation failed'}
@{javaHome=$env:JAVA_HOME;sdkRoot=$sdkRoot;jdkSource=$jdkPackage.link;jdkSHA256=$jdkPackage.checksum;sdkSHA256=$sdkHash} | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $toolRoot 'toolchain.json')
$sdkProperty=$sdkRoot.Replace('\','/')
"sdk.dir=$sdkProperty" | Set-Content -Encoding ascii (Join-Path $taskRoot 'android/local.properties')
Write-Output 'Android build tools ready; toolchain checksums saved locally.'
