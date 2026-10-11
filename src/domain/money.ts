export function deliveryFeeCentavos(distanceMetres:number,perKmCentavos:number,minimumCentavos:number):number {
  if(!Number.isFinite(distanceMetres)||distanceMetres<0||distanceMetres>100000) throw new Error('Invalid route distance');
  if(!Number.isInteger(perKmCentavos)||perKmCentavos<0||perKmCentavos>100000||!Number.isInteger(minimumCentavos)||minimumCentavos<0||minimumCentavos>100000) throw new Error('Invalid delivery policy');
  return Math.max(Math.ceil(minimumCentavos/100),Math.ceil(distanceMetres*perKmCentavos/100000))*100;
}
export const formatMoney=(centavos:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(centavos/100);
export const formatDate=(date:string)=>new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(new Date(date));
