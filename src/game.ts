import { RealityScene, Entity, Mesh, Material, Camera, Light, Environment, Animation } from '@juno/realitykit';
import type { ColorValue, RealityUpdateEvent } from '@juno/realitykit';
const palette = { grass:0x627d55, edge:0x384b3d, path:0xc4b38b, wood:0x614632, beam:0x45372c, plaster:0xe2c99c, roof:0x386c72, stone:0x8e9385, gold:0xe6b557 };
const mats = new Map<string,Material>();
function mat(c:ColorValue){const k=String(c);if(!mats.has(k))mats.set(k,Material.pbr({baseColor:c,roughness:0.88}));return mats.get(k)!;}
export type House = {name:string,x:number,z:number,w:number,d:number,front:Entity,roof:Entity,upper:Entity,two:boolean};
export class VillageGame {
 scene=new RealityScene(); camera=new Entity({camera:Camera.orthographic({scale:9.5,far:150})});
 party:Entity[]=[]; houses:House[]=[]; npcs:Entity[]=[]; route:{x:number,z:number}[]=[]; target:{x:number,z:number}|null=null; stick={x:0,z:0}; x=0;z=5;floor=0;inside:House|undefined; visited=new Set<string>(); message='Follow the lanterns to the Copper Fox.'; time=0;
 constructor(){
 this.scene.background=0x92a69a;this.scene.environment=Environment.color(0xffedcf,{intensity:0.8});
 const sun=new Entity({position:[-8,18,8],light:Light.directional({color:0xffe2af,intensity:2100,shadow:{maximumDistance:55}})});sun.lookAt([0,0,0]);this.scene.add(sun,this.camera);
 this.box(this.scene.root,'village island',0,-0.6,0,34,1,34,palette.edge);
 this.box(this.scene.root,'meadow',0,-0.08,0,33.5,0.25,33.5,palette.grass);
 this.box(this.scene.root,'main lane',0,0.07,0,3.5,0.08,32,palette.path);
 this.box(this.scene.root,'market lane',0,0.08,2,29,0.07,2.8,palette.path);
 for(let i=0;i<65;i++){const x=Math.sin(i*17.2)*15,z=Math.cos(i*7.9)*15;if(Math.abs(x)>2&&Math.abs(z-2)>1.7)this.box(this.scene.root,'grass tuft',x,0.12,z,0.15,0.22,0.15,i%2?0x80945d:0x97a46c);}
 this.house('Copper Fox Inn',-5,-3,6,6,true,palette.roof);
 this.house('Moonleaf Apothecary',5,-4,5,5,false,0x70618b);
 this.house('Ember & Anvil',-6,8,5,4,false,0x9d6249);
 this.house('Rosewood Cottage',6,8,5,4,true,0x9d7355);
 for(const h of this.houses)this.furnish(h);
 // Village well and market stalls.
 this.cylinder(this.scene.root,'well stone',0,0.42,0,0.85,0.75,palette.stone);
 this.cylinder(this.scene.root,'well water',0,0.82,0,0.64,0.03,0x4d8f99);
 for(const x of [-1,1])this.box(this.scene.root,'well post',x,1.25,0,0.12,2.5,0.12,palette.wood);
 this.box(this.scene.root,'well canopy',0,2.5,0,2.5,0.18,1.8,palette.roof);
 for(let n=0;n<2;n++){const x=10,z=-1+n*4;this.box(this.scene.root,'market counter',x,0.65,z,2.2,1.1,1,palette.wood);for(let i=0;i<6;i++)this.sphere(this.scene.root,'market produce',x-0.8+i*0.3,1.28,z,0.18,n?0xe2b44f:0xc5674b);for(const dx of [-1,1])this.box(this.scene.root,'stall pole',x+dx,1.25,z,0.09,2.5,0.09,palette.beam);for(let i=0;i<6;i++)this.box(this.scene.root,'striped awning',x-0.92+i*0.37,2.5,z,0.37,0.13,1.7,i%2?0xe3cd9d:0xa55e4d);}
 for(let i=0;i<19;i++){const angle=i*2.4,x=Math.sin(angle)*(12+i%3),z=Math.cos(angle)*(12+i%3);this.tree(x,z,i);}
 for(const [x,z] of [[-1.9,4],[1.9,-7],[-10,2],[8,3]]){this.box(this.scene.root,'lantern post',x,1.2,z,0.12,2.4,0.12,palette.beam);this.box(this.scene.root,'lantern',x,2.45,z,0.34,0.45,0.34,palette.gold);}
 this.party=[this.person('Rowan',0,5,0x387c91),this.person('Lyra',-0.7,6,0xa56a85),this.person('Bram',0.6,6.5,0xc29551)];
 this.npcs=[this.person('Mira the herbalist',5,-4,0x7f9870),this.person('Tavern keeper',-6,-4,0xb1794c),this.person('Village smith',-6,8,0x6a7184),this.person('Market trader',9,2,0xae6850),this.person('Wandering bard',2,4,0x8b739e)];
 this.camera.position.set(12,18,25);this.camera.lookAt([0,0,4]);
 }
 box(p:Entity,n:string,x:number,y:number,z:number,w:number,h:number,d:number,c:ColorValue){const e=new Entity({name:n,position:[x,y,z],model:{mesh:Mesh.box(w,h,d,{cornerRadius:0.025}),material:mat(c)}});p.addChild(e);return e;}
 cylinder(p:Entity,n:string,x:number,y:number,z:number,r:number,h:number,c:ColorValue){const e=new Entity({name:n,position:[x,y,z],model:{mesh:Mesh.cylinder(r,h),material:mat(c)}});p.addChild(e);return e;}
 sphere(p:Entity,n:string,x:number,y:number,z:number,r:number,c:ColorValue){const e=new Entity({name:n,position:[x,y,z],model:{mesh:Mesh.sphere(r),material:mat(c)}});p.addChild(e);return e;}
 tree(x:number,z:number,i:number){this.cylinder(this.scene.root,'tree trunk',x,1,z,0.18,2,palette.wood);for(let j=0;j<3;j++){const e=new Entity({name:'layered treetop',position:[x,2+j*0.65,z],model:{mesh:Mesh.cone(1.7,1.25-j*0.26),material:mat(i%3?0x3c6550:0x879556)}});this.scene.add(e);}}
 person(name:string,x:number,z:number,color:number){const p=new Entity({name,position:[x,0.15,z]});this.scene.add(p);this.cylinder(p,name+' boots',0,0.13,0,0.2,0.25,0x3c3530);this.box(p,name+' cloak',0,0.52,0,0.52,0.7,0.36,color);this.sphere(p,name+' head',0,1.04,0,0.23,0xe6bc91);this.sphere(p,name+' hair',0,1.18,0.02,0.22,0x503b32);this.box(p,name+' pack',0,0.65,0.25,0.32,0.4,0.18,0x79553d);return p;}
 house(name:string,x:number,z:number,w:number,d:number,two:boolean,color:number){const root=new Entity({name,position:[x,0,z]});this.scene.add(root);const front=new Entity({name:name+' fading walls'}),roof=new Entity({name:name+' roof'}),upper=new Entity({name:name+' upper floor'});root.addChild(front,roof,upper);
 this.box(root,'foundation',0,0.15,0,w+0.25,0.3,d+0.25,palette.stone);
 for(let i=0;i<Math.floor(w/0.45);i++)this.box(root,'oak floorboard',-w/2+0.23+i*0.45,0.33,0,0.43,0.08,d-0.2,0xa5845d);
 this.box(root,'back plaster',0,1.65,-d/2,w,2.7,0.18,palette.plaster);
 this.box(root,'west wall',-w/2,1.65,0,0.18,2.7,d,palette.plaster);
 this.box(front,'east wall',w/2,1.65,0,0.18,2.7,d,palette.plaster);
 for(const side of [-1,1])this.box(front,'doorway wall',side*(w/4+0.4),1.65,d/2,w/2-0.8,2.7,0.18,palette.plaster);
 this.box(front,'door lintel',0,2.7,d/2,1.6,0.6,0.23,palette.wood);
 for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])this.box(dz>0||dx>0?front:root,'timber corner',dx,1.65,dz,0.22,2.8,0.22,palette.beam);
 for(let i=0;i<3;i++)this.box(root,'back timber',-w/2+i*w/2,1.65,-d/2+0.12,0.13,2.7,0.1,palette.beam);
 this.box(root,'back window',0,1.8,-d/2+0.13,1,0.9,0.08,0x638f96);
 const rh=two?5.7:3.1;
 if(two){this.box(roof,'upstairs exterior',0,4.35,0,w,2.6,d,palette.plaster);for(let i=0;i<3;i++)this.box(roof,'upstairs windows',-w/3+i*w/3,4.5,d/2+0.02,0.65,0.85,0.1,0xe6b65c);
 this.box(upper,'upper floor',0,3.1,0,w,0.16,d,palette.wood);this.box(upper,'upstairs rug',0,3.22,0,2.5,0.04,2,0x8e5460);
 for(const dx of [-1.5,1.5]){this.box(upper,'bed frame',dx,3.5,-1,1.25,0.5,2,palette.wood);this.box(upper,'quilt',dx,3.8,-0.8,1.15,0.18,1.5,0x6d8991);this.box(upper,'pillow',dx,3.85,-1.5,0.85,0.2,0.4,0xeee0b8);}upper.isEnabled=false;
 for(let i=0;i<9;i++)this.box(root,'stair tread',-w/2+0.65,0.48+i*0.3,-d/2+0.5+i*0.33,1,0.2,0.38,palette.wood);}
 for(const side of [-1,1]){const e=this.box(roof,'pitched roof',side*w/4,rh+0.8,0,w/2+0.6,0.22,d+0.9,color);e.rotation.z=-side*0.46;}
 this.box(roof,'roof ridge',0,rh+1.43,0,0.22,0.2,d+1,palette.beam);
 this.box(roof,'chimney',-w/3,rh+1.2,-d/4,0.65,2.1,0.65,palette.stone);
 this.box(root,'welcome step',0,0.2,d/2+0.4,1.6,0.2,0.7,palette.stone);
 for(const sx of [-1,1]){this.box(front,'window frame',sx*(w/2-0.85),1.8,d/2+0.12,0.75,0.9,0.12,palette.beam);this.box(front,'golden window',sx*(w/2-0.85),1.8,d/2+0.2,0.58,0.72,0.05,0xcaa65f);this.box(front,'window cross',sx*(w/2-0.85),1.8,d/2+0.24,0.05,0.75,0.04,palette.wood);this.box(front,'flower box',sx*(w/2-0.85),1.23,d/2+0.3,0.9,0.18,0.38,palette.wood);for(let j=0;j<3;j++)this.sphere(front,'window flowers',sx*(w/2-0.85)-0.25+j*0.25,1.4,d/2+0.3,0.13,j%2?0xd4b35e:0xb9656d);}
 this.houses.push({name,x,z,w,d,front,roof,upper,two});}
 furnish(h:House){const p=new Entity({name:h.name+' furnishings',position:[h.x,0,h.z]});this.scene.add(p);
 if(h.name.includes('Anvil')){this.box(p,'anvil pedestal',1,0.65,0.8,0.7,0.6,0.7,palette.wood);this.box(p,'iron anvil',1,1.05,0.8,1.15,0.3,0.45,0x49545b);for(let i=0;i<3;i++){this.box(p,'tool handle',-1+i*0.4,1.6,-h.d/2+0.25,0.07,0.9,0.08,palette.wood);this.box(p,'hammer head',-1+i*0.4,2,-h.d/2+0.25,0.3,0.17,0.2,0x67767c);}}
 if(h.name.includes('Moon')){for(let i=0;i<4;i++){this.cylinder(p,'herb pot',-h.w/2+0.5,0.7,-0.8+i*0.7,0.2,0.4,0x9f6b52);this.sphere(p,'herb leaves',-h.w/2+0.5,1,-0.8+i*0.7,0.3,i%2?0x94a36a:0x597f6e);}}
 this.box(p,'woven rug',0,0.39,0,2.4,0.04,2.6,h.name.includes('Moon')?0x88709a:0xa66851);
 this.box(p,'dining table',0,1.05,-0.5,1.6,0.16,1.1,palette.wood);for(const x of [-0.6,0.6])for(const z of [-0.85,-0.15])this.box(p,'table leg',x,0.68,z,0.12,0.7,0.12,palette.beam);
 for(const x of [-1.2,1.2]){this.box(p,'chair seat',x,0.72,-0.5,0.55,0.15,0.55,palette.wood);this.box(p,'chair back',x+(x<0?-0.2:0.2),1.04,-0.5,0.12,0.65,0.55,palette.wood);}
 this.cylinder(p,'plate',0,1.16,-0.5,0.25,0.04,0xe4d7b4);this.cylinder(p,'candle',0.45,1.3,-0.5,0.06,0.3,0xffda8a);
 this.box(p,'shelves',1.5,1.3,-h.d/2+0.5,1.8,1.8,0.6,palette.wood);for(let j=0;j<2;j++)for(let i=0;i<5;i++)this.box(p,'books and potions',0.8+i*0.3,1+j*0.65,-h.d/2+0.12,0.18,0.4,0.24,[0x718a75,0xae6d53,0xd2b574][i%3]);
 for(let i=0;i<2;i++)this.cylinder(p,'storage barrel',h.w/2-0.65,0.8,h.d/2-0.8-i*0.9,0.38,0.9,0x926a43);
 this.box(p,'hearth',-h.w/2+0.5,0.8,-h.d/2+0.7,0.8,0.9,1,palette.stone);this.sphere(p,'embers',-h.w/2+0.55,0.85,-h.d/2+0.8,0.24,0xf2a94d);
 }
 allowed(x:number,z:number){if(Math.abs(x)>15||Math.abs(z)>15)return false;for(const h of this.houses){const dx=Math.abs(x-h.x),dz=Math.abs(z-h.z);if(dx<h.w/2+0.2&&dz<h.d/2+0.2){const inner=dx<h.w/2-0.35&&dz<h.d/2-0.35;const door=dx<0.58&&z>h.z+h.d/2-0.7;if(!inner&&!door)return false;}}return true;}
 walkTo(x:number,z:number){this.route=[];this.target={x,z};}
 visitInn(){this.route=[{x:0,z:1.2},{x:-5,z:1.2},{x:-5,z:-1.8}];this.target=this.route.shift()!;this.message='To the Copper Fox · follow your party inside.';}
 update(e:RealityUpdateEvent){const dt=Math.min(e.deltaTime,0.07);this.time+=dt;let dx=this.stick.x,dz=this.stick.z;if(this.target&&Math.hypot(dx,dz)<0.1){dx=this.target.x-this.x;dz=this.target.z-this.z;if(Math.hypot(dx,dz)<0.15){this.target=this.route.shift()||null;dx=dz=0;}}
 const len=Math.hypot(dx,dz);let changed=false;if(len>0.05){dx/=len;dz/=len;const nx=this.x+dx*dt*3,nz=this.z+dz*dt*3;if(this.allowed(nx,this.z))this.x=nx;if(this.allowed(this.x,nz))this.z=nz;this.party[0].position.set(this.x,this.floor?3.25:0.4,this.z);this.party[0].rotation.y=Math.atan2(dx,dz);for(let i=1;i<3;i++){const p=this.party[i],tx=this.x-dx*i*0.65+(i===1?-0.45:0.45),tz=this.z-dz*i*0.65;p.position.x+=(tx-p.position.x)*Math.min(1,dt*5);p.position.z+=(tz-p.position.z)*Math.min(1,dt*5);p.position.y=this.floor?3.25:0.4;p.rotation.y=Math.atan2(dx,dz);}changed=true;}
 const h=this.houses.find(h=>Math.abs(this.x-h.x)<h.w/2-0.2&&Math.abs(this.z-h.z)<h.d/2-0.15);if(h!==this.inside){this.inside=h;this.floor=0;if(h){this.visited.add(h.name);this.message=this.visited.size===4?'Mossvale explored! All four stories found.':h.two?'Inside '+h.name+' · stairs are by the left wall.':'Inside '+h.name+' · the walls fade for your party.';}else this.message='Explore the village · tap the lane or drag to walk.';changed=true;}
 for(const b of this.houses){const opacity=b===h?0.07:1;for(const part of [b.front,b.roof]){if(Math.abs(part.opacity-opacity)>0.01){part.opacity+=(opacity-part.opacity)*Math.min(1,dt*7);changed=true;}}b.upper.isEnabled=b===h&&this.floor===1;}
 if(changed){const y=this.floor?3:0;this.camera.position.set(this.x+12,18+y,this.z+20);this.camera.lookAt([this.x,y,this.z-1]);}return changed;
 }
 stairs(){if(this.inside?.two){this.floor=1-this.floor;this.party.forEach(p=>p.position.y=this.floor?3.25:0.4);this.message=this.floor?'Guest rooms · a quiet place above the village.':'Back in the common room.';this.inside.upper.isEnabled=!!this.floor;const y=this.floor?3:0;this.camera.position.set(this.x+12,18+y,this.z+20);this.camera.lookAt([this.x,y,this.z-1]);this.scene.invalidate();}}
 interact(){const npc=this.npcs.find(p=>Math.hypot(p.position.x-this.x,p.position.z-this.z)<2.7);this.message=npc?({'Mira the herbalist':'Mira: “Moonleaf only blooms after the last bell.”','Tavern keeper':'Orin: “Beds upstairs. Stew by the fire. Welcome home.”','Village smith':'Tor: “A good blade is patient. So is its maker.”','Market trader':'Ada: “Apples for the road? Your friends look hungry.”','Wandering bard':'Finn: “Four doorways, four stories. Go find yours.”'}[npc.name]||'Welcome, traveler.'):'Visit all four buildings with Lyra and Bram. '+this.visited.size+'/4 discovered.';}
 reset(){this.x=0;this.z=5;this.floor=0;this.target=null;this.route=[];this.stick={x:0,z:0};this.camera.position.set(12,18,25);this.camera.lookAt([0,0,4]);this.visited.clear();this.party.forEach((p,i)=>p.position.set(i*0.5,0.4,5+i));this.message='A fresh morning in Mossvale.';this.scene.invalidate();}
}
