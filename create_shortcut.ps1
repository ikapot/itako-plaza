$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\ikapo\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\ItakoMobileBridge.lnk")
$Shortcut.TargetPath = "C:\Users\ikapo\Desktop\itako\start_discord_bot.bat"
$Shortcut.WorkingDirectory = "C:\Users\ikapo\Desktop\itako"
$Shortcut.Save()
