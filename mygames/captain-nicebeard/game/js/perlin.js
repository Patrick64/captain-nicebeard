!function(n){function e(n,e,t){this.x=n,this.y=e,this.z=t}function t(n){return n*n*n*(n*(6*n-15)+10)}function o(n,e,t){return(1-t)*n+t*e}var r=n.noise={};e.prototype.dot2=function(n,e){return this.x*n+this.y*e};var i=[new e(1,1,0),new e(-1,1,0),new e(1,-1,0),new e(-1,-1,0),new e(1,0,1),new e(-1,0,1),new e(1,0,-1),new e(-1,0,-1),new e(0,1,1),new e(0,-1,1),new e(0,1,-1),new e(0,-1,-1)],u=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],w=new Array(512),f=new Array(512);r.seed=function(n){n>0&&1>n&&(n*=65536),n=Math.floor(n),256>n&&(n|=n<<8);for(var e=0;256>e;e++){var t;t=1&e?u[e]^255&n:u[e]^n>>8&255,w[e]=w[e+256]=t,f[e]=f[e+256]=i[t%12]}},r.seed(0),r.perlin2=function(n,e){var r=Math.floor(n),i=Math.floor(e);n-=r,e-=i,r=255&r,i=255&i;var u=f[r+w[i]].dot2(n,e),s=f[r+w[i+1]].dot2(n,e-1),a=f[r+1+w[i]].dot2(n-1,e),d=f[r+1+w[i+1]].dot2(n-1,e-1),h=t(n);return o(o(u,a,h),o(s,d,h),t(e))}}(this),"undefined"!=typeof module&&(module.exports=this.noise);