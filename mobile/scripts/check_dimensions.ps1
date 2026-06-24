[System.Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
$img = [System.Drawing.Image]::FromFile("d:\Projects\Apptrololo\mobile\assets\images\renthome.png")
Write-Output "$($img.Width)x$($img.Height)"
$img.Dispose()
