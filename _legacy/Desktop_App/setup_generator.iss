; setup_generator.iss
; Script para Inno Setup - AgroGB v2.1.0

[Setup]
AppName=AgroGB
AppVersion=2.1.0
DefaultDirName={localappdata}\AgroGB
DefaultGroupName=AgroGB
OutputBaseFilename=Instalar_AgroGB_v2.1
Compression=lzma2/max
SolidCompression=yes
SetupIconFile=assets\app_icon.ico
UninstallDisplayIcon={app}\AgroGB_v2.exe
PrivilegesRequired=lowest
CloseApplications=yes
AppMutex=AgroGB_Mutex

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\AgroGB_v2.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs
Source: "agrogb.db"; DestDir: "{app}"; Flags: onlyifdoesntexist

[Icons]
Name: "{group}\AgroGB"; Filename: "{app}\AgroGB_v2.exe"
Name: "{userdesktop}\AgroGB"; Filename: "{app}\AgroGB_v2.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\AgroGB_v2.exe"; Description: "{cm:LaunchProgram,AgroGB}"; Flags: nowait postinstall skipifsilent
