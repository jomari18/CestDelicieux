$ErrorActionPreference='Stop'
$restaurantRoot=[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$restaurantData=[System.IO.Path]::GetFullPath((Join-Path $restaurantRoot '.local-db'))
if(-not $restaurantData.StartsWith($restaurantRoot+[System.IO.Path]::DirectorySeparatorChar)){throw 'Unsafe cluster path'}
$restaurantBin='C:/Program Files/PostgreSQL/18/bin'
if(-not(Test-Path -LiteralPath (Join-Path $restaurantData 'PG_VERSION'))){
 & (Join-Path $restaurantBin 'initdb.exe') -D $restaurantData -U restaurant_test -A trust -E UTF8
 if($LASTEXITCODE -ne 0){throw 'Cannot initialize restaurant test cluster'}
}
& (Join-Path $restaurantBin 'pg_ctl.exe') -D $restaurantData status
if($LASTEXITCODE -ne 0){
 & (Join-Path $restaurantBin 'pg_ctl.exe') -D $restaurantData -l (Join-Path $restaurantRoot '.local-postgres.log') -o '-p 55434 -h 127.0.0.1' -t 30 start
 if($LASTEXITCODE -ne 0){throw 'Cannot start restaurant test cluster'}
}
$restaurantExists=& (Join-Path $restaurantBin 'psql.exe') -h 127.0.0.1 -p 55434 -U restaurant_test -d postgres -Atc "select 1 from pg_database where datname='cestdelicieux_test'"
if($LASTEXITCODE -ne 0){throw 'Cannot inspect private test cluster'}
if($restaurantExists -ne '1'){& (Join-Path $restaurantBin 'createdb.exe') -h 127.0.0.1 -p 55434 -U restaurant_test cestdelicieux_test;if($LASTEXITCODE -ne 0){throw 'Cannot create test database'}}
Write-Output 'Dedicated synthetic restaurant test database ready on 127.0.0.1:55434.'
