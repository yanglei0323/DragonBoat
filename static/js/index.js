//		2017/5/23------------
//		重新修改canvas大小以适配移动端-----------
//		真机未测------
var viewHeight=window.innerHeight||document.documentElement.clientHeight;
var viewWidth=window.innerWidth||document.documentElement.clientWidth;
$('#stage').css('width',viewWidth);
$('#stage').css('height',viewHeight);
$('#stage').attr('width',viewWidth);
$('#stage').attr('height',viewHeight);
$('#gamepanel').css('width',viewWidth);
$('#gamepanel').css('height',viewHeight);
// 音乐控制
function audioAutoPlay(id){  
    var audio = document.getElementById(id),  
    play = function(){  
        audio.play();  
        document.removeEventListener("touchstart",play, false);  
    };  
    audio.play();  
    document.addEventListener("WeixinJSBridgeReady", function () {  
        play();  
    }, false);  
    document.addEventListener('YixinJSBridgeReady', function() {  
        play();  
    }, false);  
    document.addEventListener("touchstart",play, false);  
}  
audioAutoPlay('audio');
$('.music').on('click',function(){
    $(this).toggleClass('play');
    var audio = document.getElementById('audio');
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});
function Ship(ctx){
	gameMonitor.im.loadImage(['static/img/player.png']);
	this.width = 80;
	this.height = 80;
	this.left = gameMonitor.w/2 - this.width/2;
	this.top = gameMonitor.h - 2*this.height;
	this.player = gameMonitor.im.createImage('static/img/player.png');

	this.paint = function(){
		ctx.drawImage(this.player, this.left, this.top, this.width, this.height);
	}

	this.setPosition = function(event){
		if(gameMonitor.isMobile()){
			var tarL = event.changedTouches[0].clientX;
			var tarT = event.changedTouches[0].clientY;
		}
		else{
			var tarL = event.offsetX;
			var tarT = event.offsetY;
		}
		this.left = tarL - this.width/2 - 16;
		this.top = tarT - this.height/2;
		if(this.left<0){
			this.left = 0;
		}
		if(this.left>viewWidth-this.width){
			this.left = viewWidth-this.width;
		}
		if(this.top<0){
			this.top = 0;
		}
		if(this.top>gameMonitor.h - this.height){
			this.top = gameMonitor.h - this.height;
		}
		this.paint();
	}

	this.controll = function(){
		var _this = this;
		var stage = $('#gamepanel');
		var currentX = this.left,
			currentY = this.top,
			move = false;
		stage.on(gameMonitor.eventType.start, function(event){
			_this.setPosition(event);
			move = true;
		}).on(gameMonitor.eventType.end, function(){
			move = false;
		}).on(gameMonitor.eventType.move, function(event){
			event.preventDefault();
			if(move){
				_this.setPosition(event);	
			}
			
		});
	}

	this.eat = function(foodlist){
		for(var i=foodlist.length-1; i>=0; i--){
			var f = foodlist[i];
			if(f){
				var l1 = this.top+this.height/2 - (f.top+f.height/2);
				var l2 = this.left+this.width/2 - (f.left+f.width/2);
				var l3 = Math.sqrt(l1*l1 + l2*l2);
				if(l3<=this.height/2 + f.height/2){
					foodlist[f.id] = null;
					if(f.type==0){
						gameMonitor.stop();
						$('#gameoverPanel').show();

						setTimeout(function(){
							$('#gameoverPanel').hide();
							$('#resultPanel').show();
							gameMonitor.getScore();
						}, 2000);
					}
					else{
						$('#score').text(++gameMonitor.score);
						$('.heart').removeClass('hearthot').addClass('hearthot');
						setTimeout(function() {
							$('.heart').removeClass('hearthot')
						}, 200);
					}
				}
			}
			
		}
	}
}

function Food(type, left, id){
	this.speedUpTime = 300;
	this.id = id;
	this.type = type;
	this.width = 50;
	this.height = 50;
	this.left = left;
	this.top = -50;
	this.speed = 0.04 * Math.pow(1.2, Math.floor(gameMonitor.time/this.speedUpTime));
	this.loop = 0;

	var p = this.type == 0 ? 'static/img/food1.png' : 'static/img/food2.png';
	this.pic = gameMonitor.im.createImage(p);
}
Food.prototype.paint = function(ctx){
	ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
}
Food.prototype.move = function(ctx){
	if(gameMonitor.time % this.speedUpTime == 0){
		this.speed *= 1.2;
	}
	this.top += ++this.loop * this.speed;
	if(this.top>gameMonitor.h){
	 	gameMonitor.foodList[this.id] = null;
	}
	else{
		this.paint(ctx);
	}
}


function ImageMonitor(){
	var imgArray = [];
	return {
		createImage : function(src){
			return typeof imgArray[src] != 'undefined' ? imgArray[src] : (imgArray[src] = new Image(), imgArray[src].src = src, imgArray[src])
		},
		loadImage : function(arr, callback){
			for(var i=0,l=arr.length; i<l; i++){
				var img = arr[i];
				imgArray[img] = new Image();
				imgArray[img].onload = function(){
					if(i==l-1 && typeof callback=='function'){
						callback();
					}
				}
				imgArray[img].src = img
			}
		}
	}
}


var gameMonitor = {
	w : viewWidth,
	h : viewHeight,
	bgWidth : viewWidth,
	bgHeight : 1319,
	time : 0,
	timmer : null,
	bgSpeed : 10,
	bgloop : 0,
	score : 0,
	user : 0,
	im : new ImageMonitor(),
	foodList : [],
	bgDistance : 0,//背景位置
	eventType : {
		start : 'touchstart',
		move : 'touchmove',
		end : 'touchend'
	},
	init : function(){
		var _this = this;
		var canvas = document.getElementById('stage');
		var ctx = canvas.getContext('2d');

		//绘制背景
		var bg = new Image();
		_this.bg = bg;
		bg.onload = function(){
          	ctx.drawImage(bg, 0, 0, _this.bgWidth, _this.bgHeight);          	
		}
		bg.src = 'static/img/bg.png';

		_this.initListener(ctx);


	},
	initListener : function(ctx){
		var _this = this;
		var body = $(document.body);
		$(document).on(gameMonitor.eventType.move, function(event){
			event.preventDefault();
		});
		body.on(gameMonitor.eventType.start, '.replay, .playagain', function(){
			$('#resultPanel').hide();
			var canvas = document.getElementById('stage');
			var ctx = canvas.getContext('2d');
			_this.ship = new Ship(ctx);
      		_this.ship.controll();
      		_this.reset();
			_this.run(ctx);
		});

		body.on(gameMonitor.eventType.start, '#frontpage', function(){
			$('#frontpage').css('left', '-100%');
		});

		body.on(gameMonitor.eventType.start, '#guidePanel', function(){
			$(this).hide();
			_this.ship = new Ship(ctx);
			_this.ship.paint();
      		_this.ship.controll();
			gameMonitor.run(ctx);
		});

		body.on(gameMonitor.eventType.start, '.share', function(){
			$.ajax({
			     type: "GET",
			     url: "http://47.92.29.81:8890/user/unl/wzinfo.json",
			     data: {'url':window.location.href.split('#')[0]},
			     dataType: "json",
			     success: function(resp){
			         if (1 === resp.code) {
			            wx.config({
			                debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
			                appId: resp.data.appid, // 必填，公众号的唯一标识
			                timestamp: resp.data.timestamp, // 必填，生成签名的时间戳
			                nonceStr: resp.data.noncestr, // 必填，生成签名的随机串
			                signature: resp.data.signature,// 必填，签名，见附录1
			                jsApiList: [
			                    'checkJsApi',
			                    'onMenuShareAppMessage',
			                    'onMenuShareTimeline'
			                ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
			            });
			            wx.ready(function () {
			            //分享给朋友
			            wx.onMenuShareAppMessage({
			                title: "啊哈哈！我"+time+"秒内吃了"+score+"个粽子，打败了全国"+user+"%的人，不服来战！", // 分享标题
			                desc: "全民“粽”动员，欢天喜地吃粽子！", // 分享描述
			                link: window.location.href.split('#')[0], // 分享链接
			                imgUrl: 'http://api.yueyishujia.com/education/www/operate/valentinesday/img/dragonboat.png', // 分享图标
			                type: 'link', // 分享类型,music、video或link，不填默认为link
			                dataUrl: "", // 如果type是music或video，则要提供数据链接，默认为空
			                success: function () {
			                // 用户确认分享后执行的回调函数
			                //$.diyAlert("分享成功！");
			                },
			                cancel: function () {
			                // 用户取消分享后执行的回调函数
			                //alert("用户取消分享！");
			                }
			            });
			            //分享到朋友圈
			            wx.onMenuShareTimeline({
			                title: "啊哈哈！我"+time+"秒内吃了"+score+"个粽子，打败了全国"+user+"%的人，不服来战！", // 分享标题
			                desc: "全民“粽”动员，欢天喜地吃粽子！", // 分享描述
			                link: window.location.href.split('#')[0], // 分享链接
			                imgUrl: 'http://api.yueyishujia.com/education/www/operate/valentinesday/img/dragonboat.png', // 分享图标
			                success: function () {
			                // 用户确认分享后执行的回调函数
			                //$.diyAlert("分享到朋友圈成功！");
			                },
			                cancel: function () {
			                // 用户取消分享后执行的回调函数
			                }
			                });
			            });
			        }
			      }
			});
			$('.weixin-share').show().on(gameMonitor.eventType.start, function(){
				$(this).hide();
			});
		});

		$.ajax({
		     type: "GET",
		     url: "http://47.92.29.81:8890/user/unl/wzinfo.json",
		     data: {'url':window.location.href.split('#')[0]},
		     dataType: "json",
		     success: function(resp){
		         if (1 === resp.code) {
		            wx.config({
		                debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
		                appId: resp.data.appid, // 必填，公众号的唯一标识
		                timestamp: resp.data.timestamp, // 必填，生成签名的时间戳
		                nonceStr: resp.data.noncestr, // 必填，生成签名的随机串
		                signature: resp.data.signature,// 必填，签名，见附录1
		                jsApiList: [
		                    'checkJsApi',
		                    'onMenuShareAppMessage',
		                    'onMenuShareTimeline'
		                ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
		            });
		            wx.ready(function () {
		            //分享给朋友
		            wx.onMenuShareAppMessage({
		                title: "全民“粽”动员，欢天喜地吃粽子！", // 分享标题
		                desc: "真的吃货，不会放弃每一颗从天而降的粽子。", // 分享描述
		                link: window.location.href.split('#')[0], // 分享链接
		                imgUrl: 'http://api.yueyishujia.com/education/www/operate/valentinesday/img/dragonboat.png', // 分享图标
		                type: 'link', // 分享类型,music、video或link，不填默认为link
		                dataUrl: "", // 如果type是music或video，则要提供数据链接，默认为空
		                success: function () {
		                // 用户确认分享后执行的回调函数
		                //$.diyAlert("分享成功！");
		                },
		                cancel: function () {
		                // 用户取消分享后执行的回调函数
		                //alert("用户取消分享！");
		                }
		            });
		            //分享到朋友圈
		            wx.onMenuShareTimeline({
		                title: "全民“粽”动员，欢天喜地吃粽子！", // 分享标题
		                desc: "真的吃货，不会放弃每一颗从天而降的粽子。", // 分享描述
		                link: window.location.href.split('#')[0], // 分享链接
		                imgUrl: 'http://api.yueyishujia.com/education/www/operate/valentinesday/img/dragonboat.png', // 分享图标
		                success: function () {
		                // 用户确认分享后执行的回调函数
		                //$.diyAlert("分享到朋友圈成功！");
		                },
		                cancel: function () {
		                // 用户取消分享后执行的回调函数
		                }
		                });
		            });
		        }
		      }
		});

	},
	rollBg : function(ctx){
		if(this.bgDistance>=this.bgHeight){
			this.bgloop = 0;
		}
		this.bgDistance = ++this.bgloop * this.bgSpeed;
		ctx.drawImage(this.bg, 0, this.bgDistance-this.bgHeight, this.bgWidth, this.bgHeight);
		ctx.drawImage(this.bg, 0, this.bgDistance, this.bgWidth, this.bgHeight);
	},
	run : function(ctx){
		var _this = gameMonitor;
		ctx.clearRect(0, 0, _this.bgWidth, _this.bgHeight);
		_this.rollBg(ctx);

		//绘制飞船
		_this.ship.paint();
		_this.ship.eat(_this.foodList);


		//产生月饼
		_this.genorateFood();

		//绘制月饼
		for(i=_this.foodList.length-1; i>=0; i--){
			var f = _this.foodList[i];
			if(f){
				f.paint(ctx);
				f.move(ctx);
			}
			
		}
		_this.timmer = setTimeout(function(){
			gameMonitor.run(ctx);
		}, Math.round(1000/60));

		_this.time++;
	},
	stop : function(){
		var _this = this
		$('#stage').off(gameMonitor.eventType.start + ' ' +gameMonitor.eventType.move);
		setTimeout(function(){
			clearTimeout(_this.timmer);
		}, 0);
		
	},
	genorateFood : function(){
		var genRate = 25; //产生月饼的频率
		var random = Math.random();
		if(random*genRate>genRate-1){
			var left = Math.random()*(this.w - 50);
			var type = Math.floor(left)%2 == 0 ? 0 : 1;
			var id = this.foodList.length;
			var f = new Food(type, left, id);
			this.foodList.push(f);
		}
	},
	reset : function(){
		this.foodList = [];
		this.bgloop = 0;
		this.score = 0;
		this.timmer = null;
		this.time = 0;
		$('#score').text(this.score);
	},
	getScore : function(){
		time = Math.floor(this.time/60);
		score = this.score;
		user = 1;
		if(score==0){
			$('#scorecontent').html('真遗憾<br>您竟然<span class="lighttext">一个</span>粽子都没有吃到');
			$('.btn1').text('大侠请重新来过').removeClass('share').addClass('playagain');
			$('#fenghao').removeClass('geili yinhen').addClass('yinhen');
			$('.replay').addClass('displayno');
			$('.bottom-icon').attr('src','static/img/yinhen_icon.png');
			return;
		}
		else if(score<10){
			user = Math.floor(0 + Math.random() * (10 - 0));
		}
		else if(score>10 && score<=20){
			user = Math.floor(10 + Math.random() * (25 - 10));
		}
		else if(score>20 && score<=40){
			user = Math.floor(26 + Math.random() * (45 - 26));
		}
		else if(score>40 && score<=60){
			user = Math.floor(46 + Math.random() * (75 - 46));
		}
		else if(score>60 && score<=80){
			user = Math.floor(76 + Math.random() * (90 - 76));
		}
		else if(score>80){
			user = Math.floor(91 + Math.random() * (100 - 91));
		}
		$('#fenghao').removeClass('geili yinhen').addClass('geili');
		$('#scorecontent').html('您在<span id="stime" class="lighttext">2378</span>秒内吃到了<span id="sscore" class="lighttext">21341</span>个粽子<br>超过了<span id="suser" class="lighttext">31%</span>的用户！');
		$('#stime').text(time);
		$('#sscore').text(score);
		$('#suser').text(user+'%');
		$('.btn1').text('请小伙伴吃粽子').removeClass('playagain').addClass('share');
		$('.replay').removeClass('displayno');
		$('.bottom-icon').attr('src','static/img/geili_icon.png');
	},
	isMobile : function(){
		var sUserAgent= navigator.userAgent.toLowerCase(),
		bIsIpad= sUserAgent.match(/ipad/i) == "ipad",
		bIsIphoneOs= sUserAgent.match(/iphone os/i) == "iphone os",
		bIsMidp= sUserAgent.match(/midp/i) == "midp",
		bIsUc7= sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4",
		bIsUc= sUserAgent.match(/ucweb/i) == "ucweb",
		bIsAndroid= sUserAgent.match(/android/i) == "android",
		bIsCE= sUserAgent.match(/windows ce/i) == "windows ce",
		bIsWM= sUserAgent.match(/windows mobile/i) == "windows mobile",
		bIsWebview = sUserAgent.match(/webview/i) == "webview";
		return (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM);
     }
}
if(!gameMonitor.isMobile()){
	gameMonitor.eventType.start = 'mousedown';
	gameMonitor.eventType.move = 'mousemove';
	gameMonitor.eventType.end = 'mouseup';
}

gameMonitor.init();
