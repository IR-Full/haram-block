#Requires -Version 5.1
<#
.SYNOPSIS
    Locks Block Haram into Google Chrome, Microsoft Edge and Brave with machine-wide browser policies.

.DESCRIPTION
    Run by the computer's owner, from an elevated PowerShell, to make the blocker hard to switch off.

    For every browser below (whether or not it is installed yet) this script:
      * force-installs Block Haram from the Chrome Web Store, so it cannot be disabled or removed;
      * disables Incognito / InPrivate, Guest mode and adding profiles, where the extension would not run;
      * Brave only: disables private windows with Tor.

    With -FamilyDns it also points every active network adapter at Cloudflare for Families
    (malware + adult content filtering, 1.1.1.3), registers its DNS-over-HTTPS template on
    Windows 11, and turns off the browsers' own secure DNS so they cannot route around it.
    That covers other browsers and apps the extension cannot reach.

    Existing policies are preserved: the extension is appended to ExtensionInstallForcelist
    instead of replacing it. Re-running the script is safe.

    On a PC that is not joined to a domain, Chrome and Edge only honour ExtensionInstallForcelist
    for extensions published in the Chrome Web Store, which is why an extension ID is required.

.PARAMETER ExtensionId
    The 32-character Chrome Web Store ID of Block Haram.

.PARAMETER FamilyDns
    Also set Cloudflare for Families as the system DNS.

.PARAMETER DryRun
    Print what would change without touching anything. Does not require administrator rights.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install-policies.ps1 -ExtensionId abcdefghijklmnopabcdefghijklmnop -DryRun

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install-policies.ps1 -ExtensionId abcdefghijklmnopabcdefghijklmnop -FamilyDns

.NOTES
    Verify afterwards at chrome://policy, edge://policy or brave://policy, then restart the browsers.
    Every change is a registry value under HKLM\SOFTWARE\Policies\<vendor>; an administrator can
    delete those values to undo it.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-p]{32}$')]
    [string]$ExtensionId,

    [switch]$FamilyDns,

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$WebStoreUpdateUrl = 'https://clients2.google.com/service/update2/crx'

# Policy names differ slightly between vendors; values are DWORDs unless they are strings.
$Browsers = @(
    @{
        Name     = 'Google Chrome'
        Key      = 'HKLM:\SOFTWARE\Policies\Google\Chrome'
        Policies = [ordered]@{
            IncognitoModeAvailability = 1   # 1 = Incognito unavailable
            BrowserGuestModeEnabled   = 0
            BrowserAddPersonEnabled   = 0
        }
    },
    @{
        Name     = 'Microsoft Edge'
        Key      = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
        Policies = [ordered]@{
            InPrivateModeAvailability = 1   # 1 = InPrivate unavailable
            BrowserGuestModeEnabled   = 0
            BrowserAddProfileEnabled  = 0
        }
    },
    @{
        Name     = 'Brave'
        Key      = 'HKLM:\SOFTWARE\Policies\BraveSoftware\Brave'
        Policies = [ordered]@{
            IncognitoModeAvailability = 1
            BrowserGuestModeEnabled   = 0
            BrowserAddPersonEnabled   = 0
            TorDisabled               = 1
        }
    }
)

$FamilyDnsServers = @('1.1.1.3', '1.0.0.3', '2606:4700:4700::1113', '2606:4700:4700::1003')
$FamilyDohTemplate = 'https://family.cloudflare-dns.com/dns-query'

function Write-Change([string]$Message) {
    $prefix = if ($DryRun) { '[dry run] ' } else { '' }
    Write-Host "  + $prefix$Message"
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    return ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Set-PolicyValue([string]$Key, [string]$Name, $Value) {
    $type = if ($Value -is [string]) { 'String' } else { 'DWord' }
    $current = $null
    if (Test-Path $Key) {
        $current = (Get-ItemProperty -Path $Key -ErrorAction SilentlyContinue).PSObject.Properties[$Name]
    }
    if ($null -ne $current -and "$($current.Value)" -eq "$Value") {
        Write-Host "  = $Name is already $Value"
        return
    }
    Write-Change "$Name = $Value"
    if (-not $DryRun) {
        if (-not (Test-Path $Key)) { New-Item -Path $Key -Force | Out-Null }
        New-ItemProperty -Path $Key -Name $Name -Value $Value -PropertyType $type -Force | Out-Null
    }
}

function Add-ForceInstall([string]$PolicyRoot) {
    $key = Join-Path $PolicyRoot 'ExtensionInstallForcelist'
    $entry = "$ExtensionId;$WebStoreUpdateUrl"

    # The list policy is a key whose values are named "1", "2", ...; keep other entries intact.
    $taken = @{}
    if (Test-Path $key) {
        foreach ($prop in (Get-ItemProperty -Path $key).PSObject.Properties) {
            if ($prop.Name -notmatch '^\d+$') { continue }
            if ("$($prop.Value)".StartsWith("$ExtensionId;")) {
                Write-Host "  = ExtensionInstallForcelist already contains the extension (entry $($prop.Name))"
                return
            }
            $taken[$prop.Name] = $true
        }
    }
    $slot = 1
    while ($taken.ContainsKey("$slot")) { $slot++ }

    Write-Change "ExtensionInstallForcelist\$slot = $entry"
    if (-not $DryRun) {
        if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
        New-ItemProperty -Path $key -Name "$slot" -Value $entry -PropertyType String -Force | Out-Null
    }
}

function Set-FamilyDns {
    Write-Host "`nSystem DNS -> Cloudflare for Families"
    $adapters = @(Get-NetAdapter -Physical | Where-Object Status -eq 'Up')
    if ($adapters.Count -eq 0) { Write-Warning 'No active physical network adapters found.' }
    foreach ($adapter in $adapters) {
        Write-Change "$($adapter.Name): DNS servers = $($FamilyDnsServers -join ', ')"
        if (-not $DryRun) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -ServerAddresses $FamilyDnsServers
        }
    }

    # Windows 11 can encrypt these lookups; older builds lack the cmdlet and simply keep plain DNS.
    if (Get-Command Add-DnsClientDohServerAddress -ErrorAction SilentlyContinue) {
        foreach ($server in $FamilyDnsServers) {
            if (Get-DnsClientDohServerAddress -ServerAddress $server -ErrorAction SilentlyContinue) {
                Write-Host "  = DoH template for $server already registered"
                continue
            }
            Write-Change "DoH template for $server = $FamilyDohTemplate"
            if (-not $DryRun) {
                Add-DnsClientDohServerAddress -ServerAddress $server -DohTemplate $FamilyDohTemplate `
                    -AllowFallbackToUdp $false -AutoUpgrade $true | Out-Null
            }
        }
    }
    if (-not $DryRun) { Clear-DnsClientCache }
}

if (-not $DryRun -and -not (Test-Administrator)) {
    throw 'Run this script from an elevated PowerShell (Run as administrator), or add -DryRun to preview.'
}

foreach ($browser in $Browsers) {
    Write-Host "`n$($browser.Name)  ($($browser.Key))"
    Add-ForceInstall $browser.Key
    foreach ($policy in $browser.Policies.GetEnumerator()) {
        Set-PolicyValue $browser.Key $policy.Key $policy.Value
    }
    if ($FamilyDns) {
        # Browser-level DoH would bypass the family resolver configured below.
        Set-PolicyValue $browser.Key 'DnsOverHttpsMode' 'off'
    }
}

if ($FamilyDns) { Set-FamilyDns }

Write-Host ''
if ($DryRun) {
    Write-Host 'Dry run finished; nothing was changed.'
} else {
    Write-Host 'Done. Restart the browsers and check chrome://policy, edge://policy or brave://policy.'
}
