import type {Vector3} from './math';

export const MAGE_INITIAL_EFFECTS={frostSlow:0.35,frostDurationSec:3,chainTargets:2,missiles:3,shieldDurationSec:5,shieldReflection:0.2,burnDurationSec:4,burnCoefficient:0.8,coneRange:6,coneAngleDeg:60} as const;
export const MAGE_SECOND_CIRCLE_EFFECTS={freezeDurationSec:1.5,chainTargets:4,hasteDurationSec:7,hasteDecisionMultiplier:1.35,hasteCantripCooldownMultiplier:0.5} as const;
export const MAGE_ULTIMATE_EFFECTS={cometDurationSec:1.5,cometIntervalSec:0.5,cometPulses:3,stasisFreezeSec:3} as const;

export function splitMagePower(total:number,part:number,count:number):number{
  return Math.round(total*part/count)-Math.round(total*(part-1)/count);
}

export function isInMageCone(origin:Vector3,point:Vector3,yawDeg:number):boolean{
  const dx=point.x-origin.x,dz=point.z-origin.z,length=Math.hypot(dx,dz);
  if(length>MAGE_INITIAL_EFFECTS.coneRange+1e-8)return false;
  if(length<1e-8)return true;
  const yaw=yawDeg*Math.PI/180;
  return (dx*Math.sin(yaw)+dz*Math.cos(yaw))/length>=Math.cos(MAGE_INITIAL_EFFECTS.coneAngleDeg*Math.PI/360)-1e-8;
}
