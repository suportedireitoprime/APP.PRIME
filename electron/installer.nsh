; Hook customizado do NSIS chamado pelo electron-builder.
; Registra o app em HKCU (chave "legítima" que apps comerciais também gravam),
; o que ajuda a construir reputação no SmartScreen.

!macro customInstall
  WriteRegStr HKCU "Software\EstudosJuridicos\VadeMecum" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\EstudosJuridicos\VadeMecum" "Version" "${VERSION}"
  WriteRegStr HKCU "Software\EstudosJuridicos\VadeMecum" "Publisher" "Estudos Juridicos"
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\EstudosJuridicos\VadeMecum"
!macroend
