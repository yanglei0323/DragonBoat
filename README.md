# DragonBoat
端午节H5营销小游戏 （感谢“进击的玉兔”canvas小游戏的开发者）

## 修改
 * 由于原项目未做移动端适配，故做修改解决此问题
 * 获取屏幕 window.innerHeight||document.documentElement.clientHeight 
 * 			  及window.innerWidth||document.documentElement.clientWidth
 * 			  赋值给canvas元素;

## 备注
 * devicePixelRatio设备像素比 webkitBackingStorePixelRatio Canvas缓冲区的像素比
 * 将canvas中的1像素等于屏幕中的1像素
 * pixelRatio: function(ctx) {
 * 	    var backingstore = ctx.webkitBackingStorePixelRatio|| 1;
 * 	    return (window.devicePixelRatio || 1) / backingstore;
 * 	},

 * 判断设备（使用hidpi-canvas.js时需要此判断，本次未使用，仅为备注记录）：
 * if (navigator.userAgent.match(/iphone/i)) {
 * 	canvas.width = width ;//恢复为原先的大小
 * 	canvas.height = height ;
 * }else{
 * 	canvas.width = width / pr;//恢复为原先的大小
 * 	canvas.height = height / pr;
 * }
