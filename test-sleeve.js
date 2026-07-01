import { getPlasticSleevesCount } from './src/features/inventory/store/moveStore.js';
console.log('TABLE BASES:', getPlasticSleevesCount({id: 'table-bases', name: 'TABLE BASES', autoPackagingType: null}, 'table-bases'));
console.log('POOL LOUNGER:', getPlasticSleevesCount({id: 'pool-lounger', name: 'POOL LOUNGER', autoPackagingType: null}, 'pool-lounger'));
console.log('G UMBRELLA:', getPlasticSleevesCount({id: 'g-umbrella', name: 'G UMBRELLA', autoPackagingType: null}, 'g-umbrella'));
console.log('6 SEAT TABLE + BASE:', getPlasticSleevesCount({id: '6-seat-table-base', name: '6 SEAT TABLE + BASE', autoPackagingType: 'Wrapping'}, '6-seat-table-base'));
