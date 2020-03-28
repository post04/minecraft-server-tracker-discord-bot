const discord = require('discord.js')
const client = new discord.Client()
const ms = require('ms')
const fs = require('fs')
let ints = []
const serverstatus = require('minecraft-server-util')
let config = require('./config.json')
let prefix = config.prefix
let permission = config.permission
let mainserver = config.serverid
let token = config.token

Date.prototype.customFormat = function(formatString){
    var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhhh,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
    YY = ((YYYY=this.getFullYear())+"").slice(-2);
    MM = (M=this.getMonth()+1)<10?('0'+M):M;
    MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
    DD = (D=this.getDate())<10?('0'+D):D;
    DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][this.getDay()]).substring(0,3);
    th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
    formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);
    h=(hhh=this.getHours());
    if (h==0) h=24;
    if (h>12) h-=12;
    hh = h<10?('0'+h):h;
    hhhh = hhh<10?('0'+hhh):hhh;
    AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
    mm=(m=this.getMinutes())<10?('0'+m):m;
    ss=(s=this.getSeconds())<10?('0'+s):s;
    return formatString.replace("#hhhh#",hhhh).replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
  };
  //end lol

  let permissions = ["CREATE_INSTANT_INVITE", "KICK_MEMBERS", "BAN_MEMBERS", "ADMINISTRATOR", "MANAGE_CHANNELS", "MANAGE_GUILD", "ADD_REACTIONS", "VIEW_AUDIT_LOG", "SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS", "MANAGE_MESSAGES", "SEND_TTS_MESSAGES", "VIEW_CHANNEL", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS", "MANAGE_ROLES", "MANAGE_NICKNAMES", "CHANGE_NICKNAME", "STREAM", "PRIORITY_SPEAKER", "USE_VAD", "MOVE_MEMBERS", "DEAFEN_MEMBERS", "MUTE_MEMBERS", "SPEAK", "CONNECT", "USE_EXTERNAL_EMOJIS", "MENTION_EVERYONE", "READ_MESSAGE_HISTORY"]
client.on('ready',async () => {
    client.user.setPresence({
        game:{
            name: prefix+"help",
            type: "PLAYING"
        }
    })
    console.log('\x1b[32mLogged in as: \x1b[34m' + client.user.tag + "\x1b[0m")
    if(!permissions.includes(permission.toUpperCase())) return console.log(`\x1b[31mERROR:\x1b[0m \x1b[44mPermission config isn't one of the avalible options!\x1b[0m\nPermissions that are useable are as follows:\n${permissions.join('\n')}`), process.exit()
    let servers = require('./servers.json')
    allupdate(servers)
})
async function allupdate(servers){
    //
    await servers.forEach(server => {
        //
        if(server.active !== true) return;
        let asd = setInterval(() => {
            //
            updateembed(server)
        }, server.time);
        ints.push(asd)
    })
}

    
//update function

const _average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

async function updateembed(data){
    //
    let servers = require('./servers.json')
    if(servers.find(i => i.ip === data.ip).active !== true) return;
    let channel = data.channelid
    let guild = data.guildid
    let messageid = data.messageid
    let average = data.average
    let pingaverage = data.pingaverage
    let ip = data.ip
    let port = data.port
    let record = data.record

    if(average.length >= Math.ceil(3600000 / data.time)){
        average.pop()
    }
    if(pingaverage.length >= Math.ceil(3600000 / data.time)){
        pingaverage.pop()
    }

    if(!client.guilds.get(guild)) return;
    guild = client.guilds.get(guild)
    if(!guild.channels.get(channel)) return;
    channel = guild.channels.get(channel)

    let newstatus = await serverstatus(ip, port)
    if(newstatus === "error"){
        channel.fetchMessage(messageid).then(mm => {
            mm.edit(`__**SERVER OFFLINE OR ERROR PINGING SERVER**__`)
        }).catch(err => {
            channel.send(`__**SERVER OFFLINE OR ERROR PINGING SERVER**__`)
        })
    }else{
        let ping = newstatus.protocolVersion
        let online = newstatus.onlinePlayers
        let date;
        let description = newstatus.descriptionText
        pingaverage.push(ping)
        average.push(online)
        let servers = require('./servers.json')
        let emoji = "⬇️"
        let numdiff = (online - servers.find(i => i.ip === ip).lastupdate)
        if(Math.sign(numdiff) === 1){
            emoji = '⬆️'
        }
        if(numdiff === 0){
            emoji = ''
        }
        servers.find(i => i.ip === ip).average = average
        servers.find(i => i.ip === ip).pingaverage = pingaverage
        servers.find(i => i.ip === ip).lastupdate = online
        if(online > record.number){
        date = new Date()
        date = date.customFormat( "#DD#/#MM#/#YYYY#" )
        servers.find(i => i.ip === ip).record.number = online
        servers.find(i => i.ip === ip).record.date = date
        }
        average = _average(average)
        pingaverage = _average(pingaverage)
        channel.fetchMessage(messageid).then(async mm=> {
                let embed = new discord.RichEmbed()
                .setTitle(ip)
                .setColor("BLUE")
                .addField(`Currently Online`, online + " | " + emoji + "(" + numdiff + ")")
                .addField(`Player Record`, servers.find(i => i.ip === ip).record.number + " on " + servers.find(i => i.ip === ip).record.date)
                .addField(`Player Average`, Math.ceil(average))
                .addField(`Ping`, ping)
                .addField(`Ping Average`, Math.ceil(pingaverage))
                .addField(`Server Description`, description.replace(/[§]./g, ""))
                channel.fetchMessage(messageid).then(async m => {
                    m.edit(embed)
                    await fs.writeFileSync('./servers.json', JSON.stringify(servers), `utf-8`)
                })
        }).catch(async err => {
            let embed = new discord.RichEmbed()
            .setTitle(ip)
            .setColor("BLUE")
            .addField(`Currently Online`, online + " | " + emoji + "(" + numdiff + ")")
            .addField(`Player Record`, servers.find(i => i.ip === ip).record.number + " on " + servers.find(i => i.ip === ip).record.date)
            .addField(`Player Average`, Math.ceil(average))
            .addField(`Ping`, ping)
            .addField(`Ping Average`, Math.ceil(pingaverage))
            .addField(`Server Description`, description.replace(/[§]./g, ""))
            channel.send(embed).then(async m => {
                servers.find(i => i.ip === ip).messageid = m.id
                await fs.writeFileSync('./servers.json', JSON.stringify(servers), `utf-8`)
            })
        })
        
    }
}

client.on('message',async msg => {
    if(msg.channel.type !== "text" || msg.guild.id !== mainserver || !msg.member.hasPermission(config.permission)) return 
    if(msg.content.startsWith(prefix)){
        let cmd = msg.content.split(" ")[0].slice(prefix.length).toLowerCase()
        let args = msg.content.split(" ").slice(1)
        if(cmd === "addserver"){
            //
            let help = new discord.RichEmbed()
            .setColor("BLUE")
            .setDescription(`__**Examples**__
            ${prefix}addserver 2b2t.org 1m 25565

            __**Args Explained**__
            \`2b2t.org\` is the servers ip, the server must be online to be added.
            \`1m\` is how often the tracker will update, lowest amount of time is every 5 seconds.
            \`25565\` is the port, this is optional (defualts to 25565 so if the port is 25565 just leave it).
            `)
            .setTitle("Addserver Command Help")
            if(!args[0] || !args[1] || !ms(args[1])) return msg.channel.send(help)
            if(!msg.guild.channels.get(config.cat)) return msg.channel.send(`❌ Error getting the category of the auto-updater! Please set the category with \`${prefix}config category category_id\``)
            let cat = msg.guild.channels.get(config.cat)
            if(cat.type !== "category") return msg.channel.send(`❌ Error getting the category of the auto-updater! Please set the category with \`${prefix}config category category_id\``)
            let time = ms(args[1])
            if(time < 5000) return msg.channel.send(help)
            let port = 25565
            //
            if(args[2] && parseInt(args[2])){
               port = parseInt(args[2]) 
            }
            let ip = args[0].toLowerCase()
            let status = await serverstatus(ip, port)
            if(status === "error") return msg.channel.send(`❌ That server does not seem to be online!`)
            let description = status.descriptionText
            let online = status.onlinePlayers
            let servers = require('./servers.json')
            //
            if(servers.find(server => server.ip === ip.toLowerCase()) && servers.find(server => server.ip === ip).active === true) return msg.channel.send(`❌ You already have that server added!`)
            let data = {
                ip: ip.toLowerCase(),
                port: port,
                time: time,
                active: true,
                guildid: msg.guild.id,
                messageid: null,
                channelid: null,
                average: [],
                pingaverage: [],
                lastupdate: online,
                record: {"number": 0, "date": "N/A"}
            }
            msg.guild.createChannel(ip, {type: "text", parent: cat.id}).then(c => {
                data.channelid = c.id
                //
                let embed = new discord.RichEmbed()
                .setTitle(ip)
                .setColor("BLUE")
                .addField(`Currently Online`, online)
                .addField(`Player Average`, `N/A`)
                .addField(`Server Description`, description.replace(/[§]./g, ""))
                c.send(embed).then(m => {
                    msg.channel.send("✅ \`" + ip +"\` has been added!")
                    data.messageid = m.id
                    servers.push(data)
                    fs.writeFileSync(`./servers.json`, JSON.stringify(servers), `utf-8`)
                    let servers1 = require('./servers.json')
                    allupdate(servers1)
                    //
                })
            })
        }
        if(cmd === "configurelogging"){
            //
            let help = new discord.RichEmbed()
            .setTitle(`StopLogging Command Help!`)
            .setColor("BLUE")
            .setDescription(`__**Examples**__
            ${prefix}configurelogging 2b2t.org show
            ${prefix}configurelogging 2b2t.org active false
            ${prefix}configurelogging 2b2t.org time 1m
            ${prefix}configurelogging list

            __**Args Explained**__
            \`2b2t.org\` is the ip of the server when you added it.
            \`show\` is showing the current config for the server logging.
            \`active\` is a configureation option, if active is false it will stop updating that server.
            \`time\` is the amount of time between updates.
            \`list\` shows all current servers you're logging.

            __**All Args Options**__
            \`show\` shows current configurations, some of these you cannot change.
            \`time\` is the amount of time between updates.
            \`active\` if this is false it will not update the server.
            `)
            let servers = require('./servers.json')
            let options = ["show", "time", "active"]
            //
            if(args[0] && args[0].toLowerCase() ==="list"){
                let servers = require('./servers.json')
                let ips = []
                await servers.forEach(s => {ips.push(s.ip)})
                let embed = new discord.RichEmbed()
                .setTitle(`Current have ${ips.length} saved server(s)!`)
                .setDescription(ips.join("\n"))
                .setColor("BLUE")
                .setFooter(`Please use ${prefix}configurelogging show {ip}`)
                msg.channel.send(embed)
            }else{
            if(!args[0] || !args[1] || !options.includes(args[1].toLowerCase())) return msg.channel.send(help)
            if(!servers.find(i => i.ip === args[0].toLowerCase())) return msg.channel.send(`❌ That server is not in the database!`)
            let ip = args[0].toLowerCase()
            let option = args[1].toLowerCase()
            if(option === "show"){
                //
                let server = servers.find(i => i.ip === ip)
                let channelid = server.channelid
                let guild = server.guildid
                if(!client.guilds.get(guild)){
                    guild = "N/A"
                }
                if(client.guilds.get(guild)){
                    guild = client.guilds.get(guild)
                }
                let time = server.time + "ms (MiliSeconds)"
                let active = server.active
                let port = server.port
                //
                let embed = new discord.RichEmbed()
                .setColor("BLUE")
                .setTitle(`Config For ${ip}`)
                .setDescription(`
                **Guild:** ${guild.name}
                **Channel:** <#${channelid}>
                **Time Between Updates:** ${time}
                **Active:** ${active}
                **Ip + Port:** ${ip +":"+port}
                `)
                msg.channel.send(embed)
            }else if(option === 'time'){
                //
                if(!args[2] || !ms(args[2])) return msg.channel.send(help)
                let time = ms(args[2])
                servers.find(i => i.ip === ip).time = time
                fs.writeFileSync('./servers.json', JSON.stringify(servers), `utf-8`)
                msg.channel.send(`__**Getting New Config**__`).then(m => {
                    let server = require('./servers.json').find(i => i.ip === ip)
                    let channelid = server.channelid
                let guild = server.guildid
                if(!client.guilds.get(guild)){
                    guild = "N/A"
                }
                if(client.guilds.get(guild)){
                    guild = client.guilds.get(guild)
                }
                let time = server.time + "ms (MiliSeconds)"
                let active = server.active
                let port = server.port
                let embed = new discord.RichEmbed()
                .setColor("BLUE")
                .setTitle(`Config For ${ip}`)
                .setDescription(`
                **Guild:** ${guild.name}
                **Channel:** <#${channelid}>
                **Time Between Updates:** ${time}
                **Active:** ${active}
                **Ip + Port:** ${ip +":"+port}
                `)
                m.edit(embed)
                for(i=0;i < ints.length;i++){
                    clearInterval(ints[i])
                }
                ints = []
                let servers = require('./servers.json')
                allupdate(servers)
                })
            }else if(option === "active"){
                let options = ["true", "false"]
                if(!args[2] || !options.includes(args[2].toLowerCase())) return msg.channel.send(help)
                let oof;
                if(args[2].toLowerCase() === "false"){
                    oof = false
                }
                if(args[2].toLowerCase() === 'true'){
                    oof = true
                }
                let server = require('./servers.json')
                server.find(i => i.ip === ip).active = oof
                fs.writeFileSync(`./servers.json`, JSON.stringify(server), `utf-8`)
                msg.channel.send(`__**Getting New Config**__`).then(m => {
                    let server = require('./servers.json').find(i => i.ip === ip)
                    let channelid = server.channelid
                let guild = server.guildid
                if(!client.guilds.get(guild)){
                    guild = "N/A"
                }
                if(client.guilds.get(guild)){
                    guild = client.guilds.get(guild)
                }
                let time = server.time + "ms (MiliSeconds)"
                let active = server.active
                let port = server.port
                let embed = new discord.RichEmbed()
                .setColor("BLUE")
                .setTitle(`Config For ${ip}`)
                .setDescription(`
                **Guild:** ${guild.name}
                **Channel:** <#${channelid}>
                **Time Between Updates:** ${time}
                **Active:** ${active}
                **Ip + Port:** ${ip +":"+port}
                `)
                m.edit(embed)
                for(i=0;i < ints.length;i++){
                    clearInterval(ints[i])
                }
                ints = []
                let servers = require('./servers.json')
                allupdate(servers)
                })
            }
        }
        }
        if(cmd === "botconfig"){
            //
            let help = new discord.RichEmbed()
            .setColor("BLUE")
            .setTitle(`BotConfig Command Help!`)
            .setDescription(`
            __**Administrator Only**__

            __**Examples**__
            ${prefix}botconfig category 46363948738947
            ${prefix}botconfig prefix !
            ${prefix}botconfig show
            ${prefix}botconfig permission aministrator

            __**Args Explained**__
            \`category\` is the category in which the channel will be made for tracking a server.
            \`46363948738947\` is the category id for that category, if you don't know how to get a category id, google it.
            \`prefix\` is the prefix the bot will use, right now the prefix is \`${prefix}\`
            \`!\` is the prefix the bot will use after the prefix has been set, it is currently \`${prefix}\`
            \`show\` will show the current config, like the prefix and category.
            \`permission\` is the permission the user needs to use bot commands, is currently \`${permission}\`
            \`administrator\` is the permission any user will need to use commands in your server.
            `)
            //
            let options = ["category", "prefix", "show", "permission"]
            if(!args[0] || !options.includes(args[0].toLowerCase())) return msg.channel.send(help)
            let option = args[0].toLowerCase()
            if(option === "show"){
                //
                let configembed = new discord.RichEmbed()
                .setColor("BLUE")
                .setTitle(`Current Bot Configs!`)
                .setDescription(`**Category_ID:** ${config.cat}\n**Prefix:** ${prefix}`)
                msg.channel.send(configembed)
            }else if(option === 'prefix'){
                //
                if(!args[1]) return msg.channel.send(help)
                config.prefix = args[1]
                fs.writeFileSync(`./config.json`, JSON.stringify(config, null, 4), `utf-8`)
                config = require('./config.json')
                prefix = config.prefix
                msg.channel.send(`✅ Prefix set to \`${prefix}\`!`)
                client.user.setActivity({name: `${prefix}help`, type: "PLAYING"})
            }else if (option === "category"){
                //
                if(!args[1] || !parseInt(args[1])) return msg.channel.send(help)
                if(!msg.guild.channels.get(args[1])) return msg.channel.send(`❌ The provided ID is not a category!`)
                let chan = msg.guild.channels.get(args[1])
                if(chan.type !== 'category') return msg.channel.send(`❌ The provided ID is not a category!`)
                config.cat = args[1]
                fs.writeFileSync(`./config.json`, JSON.stringify(config, null, 4), `utf-8`)
                config = require('./config.json')
                msg.channel.send(`✅ Category set to \`${args[1]}\`!`)
            }else{
                //
                if(!args[1] || !permissions.includes(args[1].toUpperCase())) return msg.channel.send(`❌ That is not a valid permission option!\nValid options:\n\`\`\`${permissions.join('\n')}\`\`\``)
                config.permission = args[1].toUpperCase()
                fs.writeFileSync(`./config.json`, JSON.stringify(config, null, 4), `utf-8`)
                config = require('./config.json')
                permission = config.permission
                msg.channel.send('✅ Permission set to \`' + args[1].toUpperCase() +"\`!")
            }
        }
        if(cmd == "help"){
            let help = new discord.RichEmbed()
            .setColor("BLUE")
            .setTitle(`Help command!`)
            .setDescription(`
            __**BotConfig:**__

            __**Examples**__
            ${prefix}botconfig category 46363948738947
            ${prefix}botconfig prefix !
            ${prefix}botconfig show
            ${prefix}botconfig permission aministrator

            __**ConfigureLogging:**__

            __**Examples**__
            ${prefix}configurelogging 2b2t.org show
            ${prefix}configurelogging 2b2t.org active false
            ${prefix}configurelogging 2b2t.org time 1m
            ${prefix}configurelogging list

            __**AddServer:**__

            __**Examples**__
            ${prefix}addserver 2b2t.org 1m 25565
            `)
            .setFooter(`Do .commandname to get more help!`)
            msg.channel.send(help)
        }
    }
})
client.login(token).catch(err => {
    if(err) return console.log(`\x1B[31mBad token provided!\x1b[0m`)
})