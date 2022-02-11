# reqip

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
