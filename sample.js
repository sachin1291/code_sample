// Global variable
var myg = {
    pos: {
        clientX: 0,
        clientY: 0
    }
};

var bburst = {
    lastTime: (new Date()).getTime(),
    config: {
        width: window.innerWidth,
        height: window.innerHeight,
        scalex: 1,
        scaley: 1,
        circle: {
            count: 2.50,
            minRadius: 5,
            maxRadius: 30,
            playerRadius: 10,
            speedScale: 3,
            colors: window.play_colors
        }
    },
    circles: [],
    death: function() {
        this.stop()
        $('#plays, body').css('background-color','red')
        current_score = Math.abs($('.points').html());
        localStorage.setItem('score', current_score);

        if (current_score > Math.abs(localStorage.getItem('high-score'))) {
            localStorage.setItem('high-score', current_score);
        }

        setTimeout(function(){ location.reload(); }, 1200);
    },
    stop: function() {
        $(window).unbind('keydown').unbind('blur')
        $(document).unbind('touchmove').unbind('touchstart').unbind('touchend')
        this.player = false
    },
    start: function() {

        try {
            window.analytics.trackView('Play')
        } catch (err) {

        }

        $(document).unbind('click')
        $('.startnow').unbind('click')
        $('.menu, .con_menu, .how-to-wrapper').hide();
        $('#controls').hide();
        $('#plays').show();
        $('.points').text('');

        window.screen_size = localStorage.getItem('hd_mode');

        if ('undefined' === typeof screen_size) {
            screen_size = 'nhd'
        }

        if(screen_size === 'hd') {
            bburst.config.width = 1280,
            bburst.config.height = 720
        } else if(screen_size === 'fhd') {
            bburst.config.width = 1800,
            bburst.config.height = 1000               
        } else {
            bburst.config.width = 960,  //window.innerWidth,
            bburst.config.height = 540 //window.innerHeight
        }

        console.log(bburst.config);
        bburst.resize()

        bburst.dispText = function() {}
        $(bburst.canvas).unbind('click')
        bburst.player = new Player()
        bburst.circles = []
        tapped = false
        $(document).bind('touchmove', bburst.touch_move).bind('touchstart', bburst.touch_start).bind('touchend', bburst.touch_end)
        $(window).blur(function() {
            bburst.pause()
        })
        document.addEventListener("visibilitychange", function() {
            if(document.hidden)
                bburst.pause()
        }, false);
    },
    maxCircles: function() {
        return Math.round(bburst.config.width * bburst.config.height / (10 * 1000) / bburst.config.circle.count)
    },
    pause: function() {
        if (!this.ispaused) {
            $('.menu').hide();
            bburst.dispText = function() {
                this.ctx.font = '96px Clicker Script'
                this.ctx.fillStyle = '#fff'
                this.ctx.shadowColor = '#ccc'
                this.ctx.shadowBlur = 1;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
                w = this.ctx.measureText(t = 'Paused').width
                this.ctx.fillText(t, (this.config.width - w) / 2, bburst.config.height / 2)
                this.ctx.font = 'italic 20px Georgia'
                this.ctx.fontStyle = 'italic'
                this.ctx.fillStyle = '#fff'
                this.ctx.shadowColor = '#aaa'
                this.ctx.shadowBlur = 1;
                this.ctx.shadowOffsetX = 1;
                this.ctx.shadowOffsetY = 1;
                w = this.ctx.measureText(t = 'Double tap to Unpause').width
                this.ctx.fillText(t, (this.config.width - w) / 2, bburst.config.height / 2 + 40)
            }
            this.ispaused = true
        }
    },
    unpause: function() {
        if (this.ispaused) {
            $('.menu').hide();
            bburst.dispText = function() {}
            this.ispaused = false
        }
    },
    switch_pause: function() {
        this.ispaused ? this.unpause() : this.pause()
    },
    init: function() {
        bburst.resize()

        window.music_mode = localStorage.getItem('music_mode');

        if ('undefined' !== typeof music_mode && 'true' === music_mode) {
            if ('undefined' === typeof music_player || true !== music_player) {
                try {
                    window.burst_loop = new Media('/android_asset/www/music/burst_loop.mp3');
                    burst_loop.stop();
                    burst_loop.play();
                    window.music_player = true;
                } catch (err) {
                }
            }
        } else {
            try {
                burst_loop.stop();
                window.music_player = false;              
            } catch (err) {

            }
        }

        $('.size').change(function() {
            if(screen_size == 'hd') {
                bburst.config.width = 1280,
                bburst.config.height = 720
            } else if(screen_size == 'fhd') {
                bburst.config.width = 1800,
                bburst.config.height = 1000               
            } else {
                bburst.config.width = 960, //window.innerWidth,
                bburst.config.height = 540 //window.innerHeight
            }
            bburst.resize()
        })

        $('.speed').change(function() {
            if($('.speed').val() == 'f') {
                bburst.config.circle.speedScale = 5
            } else if($('.speed').val() == 'ff') {
                bburst.config.circle.speedScale = 9             
            } else if($('.speed').val() == 'fff') {
                bburst.config.circle.speedScale = 15               
            } else {
                bburst.config.circle.speedScale = 3
            }
        })

        this.canvas = $('#plays')
        this.canvas.attr({
            width: this.config.width,
            height: this.config.height
        })
        this.canvas = this.canvas[0];
        this.ctx = this.canvas.getContext('2d');

        for (var i = this.circles.length; i < bburst.maxCircles(); i++) {
            this.circles[i] = new Circle(true);
        }

        this.check();
    },
    resize: function() {
        $(bburst.canvas).attr({
            width: bburst.config.width,
            height: bburst.config.height
        })
        bburst.config.scalex = bburst.config.width / window.innerWidth,
        bburst.config.scaley = bburst.config.height / window.innerHeight
    },
    check: function() {
        now = (new Date()).getTime()
        window.elapsed = now - bburst.lastTime
        bburst.lastTime = now

        requestAnimFrame(bburst.check)
        bburst.resize()
        bburst.ctx.clearRect(0, 0, bburst.config.width, bburst.config.height)

        if (bburst.ispaused) {
            for (var i = 0; i < bburst.circles.length; i++)
                if (bburst.circles[i])
                    if (bburst.circles[i].render())
                        i--
        } else {
            if (bburst.circles.length < bburst.maxCircles() && Math.random() < 0.25)
                bburst.circles.push(new Circle())

            for (var i = 0; i < bburst.circles.length; i++)
                if (bburst.circles[i])
                    if (bburst.circles[i].check())
                        i--
        }

        if (typeof(bburst.player) != 'undefined' && bburst.player)
            bburst.player.check()

        bburst.dispText()
    },
    touch_start: function() {
        oripos = true
        is_touch = true
        if(!tapped){
            tapped=setTimeout(function(){
                tapped=null
            },200);
        } else {
            clearTimeout(tapped);
            tapped=null
            bburst.switch_pause()
        }
    },
    touch_end: function() {
        is_touch = false
    },
    touch_move: function(e) {
        e.preventDefault()
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]
        var NclientX = touch.clientX - myg.pos.clientX
        var NclientY = touch.clientY - myg.pos.clientY
        myg.pos = touch
        bburst.move({clientX: NclientX, clientY: NclientY})
        
        // Check and unset so circle doesnot reappear at new touch position from original
        if (oripos) {
            oripos = false
        }

        //Detect touch position relative to player
        var client_rat_x = (touch.clientX/bburst.config.width)/(bburst.player.x/bburst.config.width);
        var client_rat_y = (touch.clientY/bburst.config.height)/(bburst.player.y/bburst.config.height);

        if ('undefined' !== typeof screen_size && 'hd' === screen_size) { 
            if (0.40 < client_rat_x && client_rat_x < 0.60 && 0.25 < client_rat_y && client_rat_y < 0.60) {
                $('#info-touch').addClass('info-touch');
            } else {
                $('#info-touch').removeClass('info-touch');
            }
        } else {
            if (0.55 < client_rat_x && client_rat_x < 0.75 && 0.30 < client_rat_y && client_rat_y < 0.70) {
                $('#info-touch').addClass('info-touch');
            } else {
                $('#info-touch').removeClass('info-touch');
            }
        }
    },
    move: function(e) {
        if (!bburst.ispaused) {
            if ('undefined' === typeof oripos) oripos = true
            if (!oripos) {
                bburst.player.x = bburst.player.x + (e.clientX * bburst.config.scalex)
                bburst.player.y = bburst.player.y + (e.clientY * bburst.config.scaley)

                if (bburst.player.x < 0) bburst.player.x = 0
                if (bburst.player.y < 0) bburst.player.y = 0
                if (bburst.player.x > bburst.config.width) bburst.player.x = bburst.config.width
                if (bburst.player.y > bburst.config.height) bburst.player.y = bburst.config.height
            }
        }
    },
    d2r: function(x) {
        return x * (Math.PI / 180);
    },
    pop: function(start_x, start_y, particle_count, color, scale) {
        arr = [];
        angle = 0;
        particles = [];
        if (scale > 10 ) { scale = 10; }
        offset_x = $("#dummy_debris").width() / 2;
        offset_y = $("#dummy_debris").height() / 2;

        for (i = 0; i < particle_count; i++) {
            rad = bburst.d2r(angle);
            x = Math.cos(rad)*(80+Math.random()*20);
            y = Math.sin(rad)*(80+Math.random()*20);
            arr.push([start_x + x, start_y + y]);
            z = $('<div class="debris" />');
            z.css({
                "left": start_x - offset_x,
                "top": start_y - offset_x,
                "background-color": color,
                "width": scale + 'px',
                "height": scale + 'px'
            }).appendTo($("#blast"));
            particles.push(z);
            angle += 360/particle_count;
        }
    
        $.each(particles, function(i, v){
            $(v).show();
            $(v).velocity(
                {
                    top: arr[i][1], 
                    left: arr[i][0],
                    width: 4, 
                    height: 4, 
                    opacity: 0
                }, 600, function() {$(v).remove()}
            );
        });
    },
    dispText: function() { }
}
var Circle = function(inCenter) {
    min = bburst.config.circle.minRadius;
    max = bburst.config.circle.maxRadius;

    if (typeof(bburst.player) != 'undefined' && bburst.player) {
        if (min < bburst.player.radius - 35) {
            min = bburst.player.radius - 35;
        }
        if (max < bburst.player.radius + 15) {
            max = bburst.player.radius + 15;
        }
    }
    this.radius = min + Math.round(Math.random() * (max - min));
    this.color = bburst.config.circle.colors[Math.floor(Math.random() * bburst.config.circle.colors.length)];

    if (inCenter) {
        this.x = Math.random() * bburst.config.width;
        this.y = Math.random() * bburst.config.height;
        this.vx = Math.random() - .5;
        this.vy = Math.random() - .5;
    } else {
        r = Math.random();
        if (r <= .25) {
            this.x = 1 - this.radius;
            this.y = Math.random() * bburst.config.height;
            this.vx = Math.random();
            this.vy = Math.random() - .5;
        } else if (r > .25 && r <= .5) {
            this.x = bburst.config.width + this.radius - 1;
            this.y = Math.random() * bburst.config.height;
            this.vx = -Math.random();
            this.vy = Math.random() - .5;
        } else if (r > .5 && r <= .75) {
            this.x = Math.random() * bburst.config.height;
            this.y = 1 - this.radius;
            this.vx = Math.random() - .5;
            this.vy = Math.random();
        } else {
            this.x = Math.random() * bburst.config.height;
            this.y = bburst.config.height + this.radius - 1;
            this.vx = Math.random() - .5;
            this.vy = -Math.random();
        }
    }
    this.vx *= bburst.config.circle.speedScale;
    this.vy *= bburst.config.circle.speedScale;
    if (Math.abs(this.vx) + Math.abs(this.vy) < 1) {
        this.vx = this.vx < 0 ? -1 : 1;
        this.vy = this.vy < 0 ? -1 : 1;
    }

    this.check = function() {
        if (!this.inBounds()) {
            for (var i = 0; i < bburst.circles.length; i++)
                if (bburst.circles[i].x == this.x && bburst.circles[i].y == this.y) {
                    bburst.circles.splice(i, 1);
                    return true;
                }
        } else {
            this.move();
            this.render();
        }
    }

    this.inBounds = function() {
        if (this.x + this.radius < 0 ||
            this.x - this.radius > bburst.config.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > bburst.config.height)
            return false;
        else
            return true;
    }

    this.move = function() {
        this.x += this.vx * elapsed / 15;
        this.y += this.vy * elapsed / 15;
    }

    this.render = function() {
        bburst.ctx.beginPath();
        bburst.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        bburst.ctx.fillStyle = this.color;
        bburst.ctx.closePath();
        bburst.ctx.fill();
    }

    this.render();
}

var Player = function() {
    this.x = bburst.config.width / 2;
    this.y = bburst.config.height / 2;
    this.color = window.player_color;
    this.radius = bburst.config.circle.playerRadius;
    this.check = function() {
        this.detect_collision();
        this.render();
    }
    var points = 0;
    this.detect_collision = function() {
        for (var i = 0; i < bburst.circles.length; i++) {
            circle = bburst.circles[i];
            dist = Math.pow(Math.pow(circle.x - this.x, 2) + Math.pow(circle.y - this.y, 2), .5);
            if (dist < circle.radius + this.radius) {

                if (circle.radius > this.radius) {
                    $('#blast').css({"top": this.y, "left": this.x});
                    //bburst.pop(this.x * bburst.config.scalex, this.y * bburst.config.scaley, 5, this.color, this.radius);
                    bburst.death();
                } else {
                    $('#blast').css({"top": this.y, "left": this.x});

                    // Disable pop effect in standard mode
                    if ('undefined' !== typeof screen_size && 'hd' === screen_size) {
                        bburst.pop((circle.x / bburst.config.scalex), (circle.y / bburst.config.scaley), 5, circle.color, circle.radius);
                    }

                    points = points + 1;
                    
                    if (45 > points && 'undefined' !== typeof screen_size && 'hd' === screen_size) {
                        this.radius++;
                    } else if (35 > points) {
                        this.radius++;
                    } else {
                        bburst.config.circle.speedScale += 0.10;
                    }
                    
                    bburst.circles.splice(i, 1);
                    i--;

                    // To be improved
/*                    if (70 == points && screen_size == 'hd') {
                        bburst.config.width = 1800,
                        bburst.config.height = 1000
                    }*/

                    $('.points').text(points);
                }
            }
        }
    }
    this.render = function() {
            bburst.ctx.beginPath();
            bburst.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            bburst.ctx.fillStyle = window.player_color;
            bburst.ctx.shadowColor = '#ccc';
            bburst.ctx.shadowBlur = 0;
            bburst.ctx.shadowOffsetX = 0;
            bburst.ctx.shadowOffsetY = 0;
            bburst.ctx.closePath();
            bburst.ctx.fill();

        }
}
