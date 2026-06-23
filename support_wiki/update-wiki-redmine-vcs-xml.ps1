<#
.SYNOPSIS
    프로젝트 모음 디렉토리 하위의 모든 .idea/vcs.xml 파일을 일괄 업데이트합니다.

.DESCRIPTION
    지정한 디렉토리를 재귀 탐색하여 .idea\vcs.xml 파일을 찾고,
    아래 설정을 덮어씁니다:
      - VcsDirectoryMappings: Git 연동
      - IssueNavigationConfiguration:
          [숫자]  → https://114.unipost.co.kr (유니포스트 이슈)
          #숫자   → https://redmine.uniworks.co.kr (레드마인 이슈)

.PARAMETER ProjectsDir
    프로젝트들이 모여 있는 상위 디렉토리 경로

.EXAMPLE
    .\update-vcs-xml.ps1 -ProjectsDir "D:\0.오찬열\00.project"

.EXAMPLE
    .\update-vcs-xml.ps1 "C:\Users\user\projects"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectsDir
)

$targetXml = @'
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="VcsDirectoryMappings">
    <mapping directory="" vcs="Git" />
  </component>
  <component name="IssueNavigationConfiguration">
    <option name="links">
      <list>
        <IssueNavigationLink>
          <option name="issueRegexp" value="\[(\d+)\]" />
          <option name="linkRegexp" value="https://114.unipost.co.kr/home.uni?access=list&amp;srIdx=$1" />
        </IssueNavigationLink>
        <IssueNavigationLink>
          <option name="issueRegexp" value="#(\d+)" />
          <option name="linkRegexp" value="https://redmine.uniworks.co.kr/issues/$1" />
        </IssueNavigationLink>
      </list>
    </option>
  </component>
</project>
'@

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $ProjectsDir) {
    Write-Host "프로젝트 모음 디렉토리 하위의 모든 .idea/vcs.xml 파일을 일괄 업데이트합니다."
    Write-Host "예시: D:\0.오찬열\00.project"
    $ProjectsDir = Read-Host "`n경로 입력"
}

if (-not (Test-Path $ProjectsDir)) {
    Write-Error "디렉토리를 찾을 수 없습니다: $ProjectsDir"
    exit 1
}

$vcsFiles = Get-ChildItem -Path $ProjectsDir -Recurse -Filter "vcs.xml" |
    Where-Object { $_.DirectoryName -like "*\.idea" }

if ($vcsFiles.Count -eq 0) {
    Write-Host "vcs.xml 파일을 찾지 못했습니다."
    exit 0
}

foreach ($file in $vcsFiles) {
    Write-Host "처리 중: $($file.FullName)"
    Set-Content -Path $file.FullName -Value $targetXml -Encoding UTF8
    Write-Host "  -> 완료"
}

Write-Host "`n총 $($vcsFiles.Count)개 파일 처리 완료."
