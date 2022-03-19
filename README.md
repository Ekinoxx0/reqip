# reqip

    # prevents the server list from advertising your server using its actual IP
    set sv_forceIndirectListing true

    # makes the server list backend request `https://server1.example.com/` instead of the default
    set sv_listingHostOverride "DOMAINE DU PROXY"
    
    # 
    set sv_listingIpOverride "IP DU PROXY"

    # a space-separated list of IPv4 networks in CIDR notation to allow 'X-Real-IP'
    # from, as well as bypass the rate limiter
    set sv_proxyIPRanges "IP DU PROXY/32"

    # the actual endpoint your server is hosted on, or one
    # or multiple server endpoint proxies as noted below
    set sv_endpoints "VRAI IP:PORT DU SERVEUR"


```

AddEventHandler("playerConnecting", function(name, setKickReason, deferrals)
    local source = source
    deferrals.defer()
    local ip = GetPlayerEndpoint(source)
    local hasWhitelistSucceeded = false
    PerformHttpRequest('http://127.0.0.1:3000/wl?ip=' .. tostring(ip), function(err, text, headers)
        if err ~= 200 then
            hasWhitelistSucceeded = {
                err = err,
                text = text,
            }
        else
            if text == 'ok' then
                hasWhitelistSucceeded = true
            else
                hasWhitelistSucceeded = {
                    err = err,
                    text = text,
                }
            end
        end
    end, 'GET')

    repeat
        if not GetPlayerName(source) then
            deferrals.done()
            return
        end

        deferrals.update('⏳ Whitelist de votre IP en cours...')
        Citizen.Wait(100)
    until hasWhitelistSucceeded ~= false

    if hasWhitelistSucceeded ~= true then
        deferrals.done('\n🚫\n🚫 Impossible de whitelist votre ip (' .. json.encode(hasWhitelistSucceeded) .. ') !\n🚫\n')
        return
    end
    
    deferrals.done()
end)
    
    
AddEventHandler('playerDropped', function()
    local ip = GetPlayerEndpoint(source)

    PerformHttpRequest('http://127.0.0.1:3000/unwl?ip=' .. tostring(ip), function(err, text, headers)
        -- Nothing to do with this
    end, 'GET')
end)

CreateThread(function()
    if GetNumPlayerIndices() > 0 then return end

    PerformHttpRequest('http://127.0.0.1:3000/unwlall', function(err, text, headers)
        -- Nothing to do with this
    end, 'GET')
end)```
