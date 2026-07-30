import React from 'react'
import { Plus, Minus, Truck } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { getPlasticSleevesCount } from '../store/moveStore'

const REAL_RENDERS = {
    'piano': '/images/inventory/piano.png',
    'sofa': '/images/inventory/sofa.png',
    'bed': '/images/inventory/bed.png',
    'table': '/images/inventory/dining-table.png',
    'jungle-gym': '/images/inventory/jungle-gym.png',
    'motorbike': '/images/inventory/motorbike.png',
    'large-statues': '/images/inventory/large-statues.png',
    'small-statues': '/images/inventory/small-statues.png',
    'large-pot-plants': '/images/inventory/large-pot-plants.png',
    'armchair-single': '/inventory/armchair-single.webp',
    'tv-large': '/images/inventory/tv-large.png',
    'tv-small': '/images/inventory/tv-small.png',
    'flatron-tv': '/images/inventory/flatron-tv.png',
    'wendy-house': '/images/inventory/wendy-house.png',
    'hifi-system': '/images/inventory/hifi-system.png',
    'room-divider': '/images/inventory/room-divider.png',
    'hall-stand': '/images/inventory/hall-stand.png',
    'golf-cart': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/image-white-golf-cart-isolated-white-background_373676-3387.jpg.avif',
    'empty-pots-large': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/clay-pot-isolated-white-background-with-clipping-path_625448-1318.jpg.avif',
    'medium-pots': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/712K5enRggL._AC_SX679_.jpg',
    'small-pots': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/P-POT-PC17L_a53bb73d-8726-403d-ae15-fed533ea3b9a.jpg.webp',
    'bulk-filers': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/Bulk-Filer-2.png',
    'concrete-garden-set': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/Screenshot-2026-04-21-at-18.30.40.png',
    'server-cabinets': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/data-center-organization-server-rack-white-background-generative-ai_506134-19453.jpg.avif',
    'lounge-recliner': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/pngtree-recliner-furniture-isolated-on-transparent-background-png-image_16751313.webp',
    'pool-lounger': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/Group16chaise_1720x1040_4ee4c655-244a-4641-a686-a55fa6c10593.jpg.webp',
    'ottoman': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/JoeRoundOttoman800_BrushedLinenChalk_A_990x.jpg.webp',
    'bean-bag-chair': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/81bf-ajW20L._AC_UF8941000_QL80_.jpg',
    'tv-entertainment-ctr': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/pngtree-rustic-tv-stand-with-two-cabinets-and-central-display-shelf-png-image_14714571.png',
    'tv-large-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/360_F_1882698633_OmrhIem4MWLKoHte3vEE0pfKp8D0lmX1.jpg',
    'tv-stand': '/inventory/tv-stand.png',
    'dining-chair': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/840B0870-6294-4AFA-AF91-34AF8248B611_700x700.png.webp',
    'tea-trolley': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/TTS1002-370x480-1.jpg',
    'sideboard-large': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/31016WHT-KIT_01_2000x.jpg.webp',
    'sideboard-small': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/ew.jpeg',
    'welsh-dresser': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images.jpeg',
    'display-cabinet': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/u330a675_vm.webp',
    'wine-rack': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/dds.jpeg',
    'king-bed-base': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-1453505460-612x612-1.jpg',
    'king-size-bed-mattras': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-1453505460-612x612-1.jpg',
    'mattress-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/mattress-single-isolated-white-background-3d-illustration_771335-16282.jpg.avif',
    'double-bed-base': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cozy-bed-with-soft-fabric-upholstery-and-stylish-wooden-frame-set-against-a-bright-white-background-free-png.png',
    'queen-bed-base': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/CreamArchieChenilleBed.jpg',
    'single-bed-base': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/wood-bed-isolated-on-white-600nw-2669527981.jpg.webp',
    'headboard-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/white-queen-furniture-of-america-bedroom-sets-idf7147whqndm-1d_600.jpg.avif',
    'single-bed-headboard': '/inventory/single-bed-headboard.png',
    'bunk-beds': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images-2.jpeg',
    'baby-cot': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/Valecia-Cotbed-Image.jpg',
    'pram': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/p01-joie-pram-chrome-2-cashew-right-angle.jpg',
    'wardrobe-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/rustic-wooden-armoire-with-clothing_191095-80018.jpg.avif',
    'compactum': '/inventory/compactum.png',
    'chest-of-drawers': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/224168512-1200-1600.webp',
    'dressing-table': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cle207_5.jpg',
    'cheval-mirror': '/images/inventory/cheval-mirror.webp',
    'large-mirror-bedroom': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/71x31.5-inch-metal-arch-stand-full-length-mirror-for-Living-RoomBedroom.jpg',
    'dumb-valet': '/images/inventory/dumb-valet.jpg',
    'boxes': '/images/inventory/boxes.avif',
    'bulk-filler': '/images/inventory/bulk-filler.jpg',
    'chair-kitchen-room': '/images/inventory/chair-kitchen-room.jpeg',
    'credenza': '/images/inventory/credenza.jpg',
    'desk-lamp': '/images/inventory/desk-lamp.webp',
    'exercise-machine-treadmill': '/images/inventory/exercise-machine-treadmill.avif',
    'hat-stand': '/images/inventory/hat-stand.png',
    'kist': '/images/inventory/kist.webp',
    'kitchen-chair': '/images/inventory/kitchen-chair.webp',
    'mirror-pictures': '/images/inventory/mirror-pictures.jpg',
    'normal-desk': '/images/inventory/normal-desk.webp',
    'painting': '/images/inventory/painting.webp',
    'pedestals': '/images/inventory/pedestals.jpg',
    'printer': '/images/inventory/printer.jpeg',
    'tall-boy': '/images/inventory/tall-boy.webp',
    'trampoline': '/images/inventory/trampoline.webp',
    'wheelbarrow': '/images/inventory/wheelbarrow.webp',
    'whiteboard': '/images/inventory/whiteboard.jpeg',
    'fridge-double-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/360_F_1966774576_7a639r3giBMyZDRuqlB5HqiKzg7NhNOj.jpg',
    'fridge-s-door-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images-3.jpeg',
    'small-fridge-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-2201593742-612x612-1.jpg',
    'bar-fridge-spec': '/inventory/barfridge.webp',
    'deep-freeze-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/KKCF07-W-ECOM-01.jpg.webp',
    'washing-machine-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/high-quality-washing-machine-with-open-door-on-transparent-background-free-png.png',
    'dishwasher-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/gray-dishwasher-on-white-background-600nw-1800440836.jpg.webp',
    'microwave-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/pngtree-an-image-of-a-white-microwave-oven-image_2642122.jpg',
    'coffee-machine-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-120874807-612x612-1.jpg',
    'vacuum-cleaner-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/wp-image-verimark-2127.jpg.webp',
    'oil-heater-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-637697510-612x612-1.jpg',
    'gas-heater-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-1443880443-612x612-1.jpg',
    'huge-gas-heater-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/street-gas-heater-isolated-on-white-background-ERHJT3.jpg',
    'large-desk': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/FOL102950_1_Supersize.jpg',
    'l-shape-desk': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/IMAY664R_664R-R_SLL-560x448-1.jpg',
    'small-desk': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/DeskBeech_4_860x.jpg.webp',
    'computer-stand': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/oka-office-pc-desk-oak-white-background.jpg',
    'office-chair': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/white-leather-office-chair-with-chrome-casteors-photo.jpeg',
    '2-drawer-fil-cabinet': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/2025-07-29_8a611858-4bdb-463d-ac39-265f68066899.png.webp',
    '4-drawer-fil-cabinet': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/4_20drawer_White_20Satin_20copy_5121aa62-4e8c-4f9d-b377-3d2432478716.jpg.webp',
    'stationery-cupboard': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/0010249_as-c3tg-image-3-stationery-cupboard-grey.png',
    'white-board': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-927784174-612x612-1.jpg',
    'lockers': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images-4.jpeg',
    'standing-shelf-unit': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-1163508815-612x612-1.jpg',
    'loose-shelves': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-509684973-612x612-1.jpg',
    'large-bookcase': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA2L3NtYWxsZGVzaWduY29tcGFueTAxX3Bob3RvX2Zyb250X3ZpZXdfd2hpdGVfbW9kZXJuX2Jvb2tjYXNlX2lzb18yOWMwZWQzOC03NzRhLTRkYTEtYTQ4NS00MmQzMmRiMTU0MDIucG5n.png.webp',
    'book-case': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/CORE0730BKCWHT-FRONT-2-1500x1500-opaque.jpg',
    'large-glass-bookcase': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images-5.jpeg',
    'pictures-mirrors-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/223561292-1200-1600.webp',
    'wall-unit-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/wtc-vogue-white-gloss-600mm-wall-unit-complete-with-doors-and-soft-close-hinges-720mm-high-300mm-deep0748322277877_02c_MP.jpeg',
    'kitchen-cupboard-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/white-kitchen-layout-with-silver-refrigerator-png.png',
    'bar-counter': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-475923944-612x612-1.jpg',
    'bench': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cwsvwe.jpeg',
    'tool-box': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/tool-box-isolated-white-background-close-up_185193-71605.jpg.avif',
    'toy-box': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/toy-chest-8227789.jpg.webp',
    'patio-table-4': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/A28_1920x.jpg.webp',
    'patio-table-set': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/outdoor-patio-dining-set-wooden-table-and-chairs-with-cushions-on-transparent-background-free-png.png',
    'patio-table-10': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/untitled-107_4f51bcd3-20f5-440f-b42b-8e97546c7512.jpg',
    'patio-chair-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/Wicker-Outdoor-Dining-Chair-Hampton-white-r1.jpg.webp',
    'plastic-chair-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/514PVttctlL.jpg',
    'garden-swing': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/51RCglKjLL._AC_SY300_SX300_QL70_ML2_.jpg',
    'garden-hose': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/us-HHJHWTYRG200FPWSU001V0-goods_img-v1-garden-hose-m100-9.jpg.webp',
    'garden-tools': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images.png',
    'g-umbrella': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cwcwe.jpeg',
    'weber-braai': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/Weber_Performer_Barbecue.png.webp',
    'bird-bath': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/d2d2.jpeg',
    'bicycle-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/isolated-mountain-bike-blue-color-600nw-1429659080.jpg.webp',
    'canoe': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/fewfefew.jpeg',
    'lawnmower-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/tandem-ratel-honda-gcv200-lawnmower-orange-black-4-wheel.png.webp',
    'weed-eater': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/CMXGTAMDSS30_1_1680.webp',
    'clothes-horse': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-538878158-612x612-1.jpg',
    'ladder-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/pngtree-a-black-folding-step-ladder-isolated-on-white-background-png-image_20116855.png',
    'dog-kennel': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-506117800-612x612-1.jpg',
    'satellite-dish-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/D100-O-SMC-V-SpaceHD-Cahors-SMC-100cm-Fibre-Dish.jpg',
    'standing-fan-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/ecwewc.jpeg',
    'exercise-bike-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/exercise-bike-on-transparent-background-free-png.png',
    'golf-bag': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-1164373836-612x612-1.jpg',
    'fishing-rod': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/360_F_228803190_aGWBJk0f77BL13G725MkoFLHdNu39fna.jpg',
    'cooler-box': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-2150396658-612x612-1.jpg',
    'bath-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cew.jpeg',
    'carton-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/images-6.jpeg',
    'standing-lamp': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/175-1753105_standing-chandelier-floor-lamp-design-andrew-martin-nelson.png.jpeg',
    'bedside-lamp': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/wefew.jpeg',
    'ironing-board-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-528768771-612x612-1.jpg',
    'suitcase-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/pngtree-isolated-white-trolley-luggage-bag-travel-bag-photography-travel-luggage-png-image_11564599.png',
    'washing-basket': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cwqcwq.jpeg',
    'dustbin': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/cewcew.jpeg',
    'carpet-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/depositphotos_63360435-stock-photo-round-carpet-isolated-on-white.jpg',
    'cd-rack': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/6_CD_DVD_Adjustable_Rack_Shelf_-_Walnut_eb687bb9-478a-46fe-95ca-a7e96737b4e9_720x.jpg.webp',
    'folding-chair-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/folding-chair-white-background-on-transparent-background-png.png',
    'folding-table-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/trestle-table-folding-1_8m-white.webp',
    'bar-stool-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/istockphoto-2162409141-612x612-1.jpg',
    'butlers-tray': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/media-000000000812928002-1-Default-WF-Default-Product.jpeg',
    'generator-spec': 'https://cloudsplash.co.za/wp/wp-content/uploads/2026/04/pngtree-portable-generator-machine-with-fuel-tank-and-control-panel-isolated-on-png-image_18146193.webp',
    // Premium photorealistic fallbacks for unmatched items
    'bed-king': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop',
    'bed-single': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800&auto=format&fit=crop',
    'washing-machine': '/images/inventory/washing-machine.webp',
    'dishwasher': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    'microwave': 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=800&auto=format&fit=crop',
    'fridge-double': 'https://images.unsplash.com/photo-1571175432248-c8a7cc02be46?q=80&w=800&auto=format&fit=crop',
    'coffee-table': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
    'sideboard': '/images/inventory/sideboard.jpeg',
    'dining-table': 'https://images.unsplash.com/photo-1577145946459-39a243444415?q=80&w=800&auto=format&fit=crop',
    'generic-box': 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad21?q=80&w=800&auto=format&fit=crop',
    'treadmill': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop',
    'outdoor-chair': 'https://images.unsplash.com/photo-1596434445336-9791485698b5?q=80&w=800&auto=format&fit=crop',
    'guitar': '/images/inventory/guitar.avif',
    'huge-gas-heaters': '/images/inventory/huge-gas-heaters.webp',
    'pedestal': '/images/inventory/pedestal.png',
    'sewing-machine': '/images/inventory/sewing-machine.jpg',
    'water-cooler': '/images/inventory/water-cooler.jpg',
    'water-machine': '/images/inventory/water-machine.webp',
}

export const getInventoryImage = (item) => {
    if (!item) return "https://img.icons8.com/3d-fluency/100/box.png";
    const id = (item.id || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    if (id.includes('fridge-double') || id.includes('fridge double') || name.includes('double door fridge') || name.includes('double-door')) {
        return '/inventory/fridge-d-door.png';
    }
    if (id.includes('fridge-d-door') || id.includes('single upright') || name.includes('single upright fridge')) {
        return '/inventory/fridge-double-upright.png';
    }

    // 0. Custom cropped database images (Priority)
    if (item.image && item.image.startsWith('/inventory/')) {
        return item.image;
    }
    
    // 0. EXACT MATCH IN REAL_RENDERS
    if (REAL_RENDERS[id]) return REAL_RENDERS[id];
    
    // 1. LOCAL OVERRIDE (Priority)
    const localPath = `/images/inventory/${id}.png`;
    
    // 2. Custom photorealistic renders (High priority hardcoded bridges)
    if (id.includes('piano')) return REAL_RENDERS['piano'] || localPath;
    if (id.includes('jungle-gym') || id.includes('jungle gym')) return REAL_RENDERS['jungle-gym'];
    if (id.includes('large-statue')) return REAL_RENDERS['large-statues'];
    if (id.includes('small-statue')) return REAL_RENDERS['small-statues'];
    if (id.includes('large-pot-plant')) return REAL_RENDERS['large-pot-plants'];
    if (id.includes('medium-pot-plant')) return REAL_RENDERS['medium-pots'];
    if (id.includes('small-pot-plant')) return REAL_RENDERS['small-pots'];
    if (id.includes('empty-pots-large') || id.includes('empty pot')) return REAL_RENDERS['empty-pots-large'];
    if (id.includes('armchair')) return REAL_RENDERS['armchair-single'];
    if (id.includes('tv large')) return REAL_RENDERS['tv-large'];
    if (id.includes('tv small')) return REAL_RENDERS['tv-small'];
    if (id.includes('flatron')) return REAL_RENDERS['flatron-tv'];
    if (id.includes('wendy house')) return REAL_RENDERS['wendy-house'];
    if (id.includes('hifi system')) return REAL_RENDERS['hifi-system'];
    if (id.includes('room-divider') || id.includes('room divider')) return REAL_RENDERS['room-divider'];
    if (id.includes('hall-stand') || id.includes('hall stand')) return REAL_RENDERS['hall-stand'];
    if (id.includes('golf-cart') || id.includes('golf cart')) return REAL_RENDERS['golf-cart'];
    if (id.includes('bulk-filer') || id.includes('bulk filer')) return REAL_RENDERS['bulk-filers'];
    if (id.includes('server-cabinet') || id.includes('server cabinet')) return REAL_RENDERS['server-cabinets'];
    if (id.includes('concrete-garden') || id.includes('concrete garden')) return REAL_RENDERS['concrete-garden-set'];
    if (id.includes('lounge-recliner') || id.includes('lounge recliner')) return REAL_RENDERS['lounge-recliner'];
    if (id.includes('pool-lounger') || id.includes('pool lounger')) return REAL_RENDERS['pool-lounger'];
    if (id.includes('ottoman')) return REAL_RENDERS['ottoman'];
    if (id.includes('bean-bag-chair') || id.includes('bean bag')) return REAL_RENDERS['bean-bag-chair'];
    if (id.includes('tv-entertainment-ctr') || id.includes('tv entertainment center')) return REAL_RENDERS['tv-entertainment-ctr'];
    if (id.includes('tv-stand') || id.includes('tv stand')) return REAL_RENDERS['tv-stand'];
    if (id.includes('tv-cabinet') || id.includes('tv cabinet')) return REAL_RENDERS['tv-entertainment-ctr']; // Same image as requested
    
    // Dining Room specifico
    if (id.includes('dining-room-chair') || id.includes('dining chair')) return REAL_RENDERS['dining-chair'];
    if (id.includes('tea-trolley') || id.includes('tea trolley')) return REAL_RENDERS['tea-trolley'];
    if (id.includes('small-sideboard')) return REAL_RENDERS['sideboard-small'];
    if (id.includes('sideboard')) return REAL_RENDERS['sideboard-large'];
    if (id.includes('welsh-dresser') || id.includes('welsh dresser')) return REAL_RENDERS['welsh-dresser'];
    if (id.includes('display-cabinet') || (id.includes('display') && id.includes('cabinet'))) return REAL_RENDERS['display-cabinet'];
    if (id.includes('wine-rack') || id.includes('wine rack')) return REAL_RENDERS['wine-rack'];

    // Bedrooms / Nursery specifico
    if (id.includes('king-size-bed-base') || id.includes('king bed base')) return REAL_RENDERS['king-bed-base'];
    if (id.includes('mattress') || id.includes('mattrass')) return REAL_RENDERS['mattress-spec'];
    if (id.includes('double-bed-base') || id.includes('double bed base')) return REAL_RENDERS['double-bed-base'];
    if (id.includes('queen-bed-base') || id.includes('queen bed base')) return REAL_RENDERS['queen-bed-base'];
    if (id.includes('single-bed-base') || id.includes('single bed base')) return REAL_RENDERS['single-bed-base'];
    if (id === 'single-bed-headboard' || id.includes('single-bed-headboard')) return REAL_RENDERS['single-bed-headboard'];
    if (id.includes('headboard')) return REAL_RENDERS['headboard-spec'];
    if (id.includes('bunk')) return REAL_RENDERS['bunk-beds'];
    if (id.includes('cot')) return REAL_RENDERS['baby-cot'];
    if (id.includes('pram')) return REAL_RENDERS['pram'];
    if (id.includes('wardrobe')) return REAL_RENDERS['wardrobe-spec'];
    if (id === 'compactum' || id.includes('compactum')) return REAL_RENDERS['compactum'];
    if (id.includes('chest of drawer') || id.includes('chest-of-drawer')) return REAL_RENDERS['chest-of-drawers'];
    if (id.includes('dressing table')) return REAL_RENDERS['dressing-table'];
    if (id.includes('cheval mirror')) return REAL_RENDERS['cheval-mirror'];
    if (id.includes('mirror (large)') || (id.includes('mirror') && id.includes('large'))) return REAL_RENDERS['large-mirror-bedroom'];
    if (id.includes('dumb valet')) return REAL_RENDERS['dumb-valet'];

    // Appliances specific
    if (id.includes('fridge double') || id.includes('fridge double upright') || id.includes('fridge-double-upright') || id.includes('double door fridge')) return REAL_RENDERS['fridge-double-spec'];
    if (id.includes('fridge s door') || id.includes('fridge-large-s-door') || id.includes('fridge d door') || id.includes('fridge-d-door') || id.includes('single upright fridge')) return REAL_RENDERS['fridge-s-door-spec'];
    if (id.includes('small fridge') || id.includes('small-fridge')) return REAL_RENDERS['small-fridge-spec'];
    if (id.includes('barfridge') || id.includes('bar fridge')) return REAL_RENDERS['bar-fridge-spec'];
    if (id.includes('deep-freeze') || id.includes('deep freeze')) return REAL_RENDERS['deep-freeze-spec'];
    if (id.includes('washing-machine') || id.includes('washing machine')) return REAL_RENDERS['washing-machine-spec'];
    if (id.includes('tumble-dryer') || id.includes('tumble dryer')) return REAL_RENDERS['washing-machine-spec']; // Same image as requested
    if (id.includes('dishwasher')) return REAL_RENDERS['dishwasher-spec'];
    if (id.includes('microwave')) return REAL_RENDERS['microwave-spec'];
    if (id.includes('coffee machine') || id.includes('coffee-machine')) return REAL_RENDERS['coffee-machine-spec'];
    if (id.includes('vacuum cleaner') || id.includes('vacuum-cleaner')) return REAL_RENDERS['vacuum-cleaner-spec'];
    if (id.includes('oil heater') || id.includes('oil-heater')) return REAL_RENDERS['oil-heater-spec'];
    if (id.includes('huge gas heater') || id.includes('huge-gas-heater')) return REAL_RENDERS['huge-gas-heater-spec'];
    if (id.includes('gas heater') || id.includes('gas-heater')) return REAL_RENDERS['gas-heater-spec'];

    // Office / Study specifico
    if (id.includes('large-desk') || id.includes('large desk')) return REAL_RENDERS['large-desk'];
    if (id.includes('l-shape-desk') || id.includes('l shape desk')) return REAL_RENDERS['l-shape-desk'];
    if (id.includes('small-desk') || id.includes('small desk')) return REAL_RENDERS['small-desk'];
    if (id.includes('computer-stand') || id.includes('computer stand')) return REAL_RENDERS['computer-stand'];
    if (id.includes('office-chair') || id.includes('office chair')) return REAL_RENDERS['office-chair'];
    if (id.includes('2-drawer-fil-cabinet') || (id.includes('2 drawer') && id.includes('cabinet'))) return REAL_RENDERS['2-drawer-fil-cabinet'];
    if (id.includes('4-drawer-fil-cabinet') || id.includes('4-drawer-fil-unit') || (id.includes('4 drawer') && id.includes('cabinet'))) return REAL_RENDERS['4-drawer-fil-cabinet'];
    if (id.includes('stationery-cupboard') || id.includes('stationery cupboard')) return REAL_RENDERS['stationery-cupboard'];
    if (id.includes('white-board') || id.includes('white board')) return REAL_RENDERS['white-board'];
    if (id.includes('lockers')) return REAL_RENDERS['lockers'];
    if (id.includes('standing-shelf-unit') || id.includes('standing shelf')) return REAL_RENDERS['standing-shelf-unit'];
    if (id.includes('loose-shelves') || id.includes('loose shelf')) return REAL_RENDERS['loose-shelves'];

    // General Furniture specifico
    if (id.includes('large-bookcase-glass') || (id.includes('bookcase') && id.includes('glass'))) return REAL_RENDERS['large-glass-bookcase'];
    if (id.includes('large-bookcase') || (id.includes('bookcase') && id.includes('large'))) return REAL_RENDERS['large-bookcase'];
    if (id.includes('book-case') || id.includes('bookcase')) return REAL_RENDERS['book-case'];
    if (id.includes('pictures-mirrors') || id.includes('pictures/mirrors')) return REAL_RENDERS['pictures-mirrors-spec'];
    if (id.includes('wall-unit') || id.includes('wall unit')) return REAL_RENDERS['wall-unit-spec'];
    if (id.includes('kitchen-cupboard') || id.includes('kitchen cupboard')) return REAL_RENDERS['kitchen-cupboard-spec'];
    if (id.includes('bar-counter') || id.includes('bar counter')) return REAL_RENDERS['bar-counter'];
    if (id.includes('bench')) return REAL_RENDERS['bench'];
    if (id.includes('tool-box') || id.includes('tool box')) return REAL_RENDERS['tool-box'];
    if (id.includes('toy-box') || id.includes('toy box')) return REAL_RENDERS['toy-box'];

    // Outdoor / Garden / Sport / Misc specifico
    if (id.includes('4-seater-patio-table') || id.includes('4 seater patio table')) return REAL_RENDERS['patio-table-4'];
    if (id.includes('10-seater-patio-table') || id.includes('10 seater patio table')) return REAL_RENDERS['patio-table-10'];
    if (id.includes('patio-table') || id.includes('patio table')) return REAL_RENDERS['patio-table-set'];
    if (id.includes('patio-chairs') || id.includes('patio chair')) return REAL_RENDERS['patio-chair-spec'];
    if (id.includes('plastic-stack-chair') || id.includes('plastic chair')) return REAL_RENDERS['plastic-chair-spec'];
    if (id.includes('garden-swing') || id.includes('garden swing')) return REAL_RENDERS['garden-swing'];
    if (id.includes('garden-hose') || id.includes('garden hose')) return REAL_RENDERS['garden-hose'];
    if (id.includes('garden-tools') || id.includes('garden tools')) return REAL_RENDERS['garden-tools'];
    if (id.includes('g-umbrella') || id.includes('umbrella')) return REAL_RENDERS['g-umbrella'];
    if (id.includes('weber-braai') || id.includes('weber') || id.includes('braai')) return REAL_RENDERS['weber-braai'];
    if (id.includes('bird-bath') || id.includes('bird bath')) return REAL_RENDERS['bird-bath'];
    if (id.includes('bicycle')) return REAL_RENDERS['bicycle-spec'];
    if (id.includes('canoe')) return REAL_RENDERS['canoe'];
    if (id.includes('lawnmower')) return REAL_RENDERS['lawnmower-spec'];
    if (id.includes('weed-eater') || id.includes('weed eater')) return REAL_RENDERS['weed-eater'];
    if (id.includes('clothes-horse') || id.includes('clothes horse')) return REAL_RENDERS['clothes-horse'];
    if (id.includes('ladder')) return REAL_RENDERS['ladder-spec'];
    if (id.includes('dog-kennel') || id.includes('dog kennel')) return REAL_RENDERS['dog-kennel'];
    if (id.includes('satellite-dish') || id.includes('dstv-dish') || id.includes('dish')) return REAL_RENDERS['satellite-dish-spec'];
    if (id.includes('standing-fan') || id.includes('standing fan')) return REAL_RENDERS['standing-fan-spec'];
    if (id.includes('exercise-bike') || id.includes('exercise bike')) return REAL_RENDERS['exercise-bike-spec'];
    if (id.includes('golf-bag') || id.includes('golf bag')) return REAL_RENDERS['golf-bag'];
    if (id.includes('fishing-rod') || id.includes('fishing rod')) return REAL_RENDERS['fishing-rod'];
    if (id.includes('cooler-box') || id.includes('cooler box')) return REAL_RENDERS['cooler-box'];
    if (id.includes('bath')) return REAL_RENDERS['bath-spec'];

    // Boxes & Loose Items specifico
    if (id.includes('general-cartons') || id.includes('linen-cartons') || id.includes('carton')) return REAL_RENDERS['carton-spec'];
    if (id.includes('standing-lamp') || id.includes('standing lamp')) return REAL_RENDERS['standing-lamp'];
    if (id.includes('bedside-lamp') || id.includes('bedside lamp')) return REAL_RENDERS['bedside-lamp'];
    if (id.includes('ironing-board') || id.includes('ironing board')) return REAL_RENDERS['ironing-board-spec'];
    if (id.includes('suitcase')) return REAL_RENDERS['suitcase-spec'];
    if (id.includes('washing-basket') || id.includes('washing basket')) return REAL_RENDERS['washing-basket'];
    if (id.includes('dustbin')) return REAL_RENDERS['dustbin'];
    if (id.includes('carpet')) return REAL_RENDERS['carpet-spec'];
    if (id.includes('cd-rack') || id.includes('cdrack') || id.includes('cd rack')) return REAL_RENDERS['cd-rack'];
    if (id.includes('folding-chair') || id.includes('folding chair')) return REAL_RENDERS['folding-chair-spec'];
    if (id.includes('folding-table') || id.includes('folding table')) return REAL_RENDERS['folding-table-spec'];
    if (id.includes('bar-stool') || id.includes('bar stool') || id.includes('chari kitchen room') || id.includes('chair kitchen room')) return REAL_RENDERS['bar-stool-spec'];
    if (id.includes('butlers-tray') || id.includes('butlers tray')) return REAL_RENDERS['butlers-tray'];
    if (id.includes('generator')) return REAL_RENDERS['generator-spec'];

    // Priority specific TVs from user
    if (id.includes('tv-large') || id.includes('tv-small') || id.includes('flatron')) return REAL_RENDERS['tv-large-spec'];

    // 3. Category Fallbacks (Photorealistic Stock)
    if (id.includes('bed') && (id.includes('king') || id.includes('double'))) return REAL_RENDERS['bed-king'];
    if (id.includes('bed') && id.includes('single')) return REAL_RENDERS['bed-single'];
    if (id.includes('washing machine')) return REAL_RENDERS['washing-machine'];
    if (id.includes('dishwasher')) return REAL_RENDERS['dishwasher'];
    if (id.includes('microwave')) return REAL_RENDERS['microwave'];
    if (id.includes('fridge') || id.includes('refrigerator')) return REAL_RENDERS['fridge-double'];
    if (id.includes('coffee table')) return REAL_RENDERS['coffee-table'];
    if (id.includes('sideboard') || id.includes('buffet')) return REAL_RENDERS['sideboard'];
    if (id.includes('dining table')) return REAL_RENDERS['dining-table'];
    if (id.includes('treadmill') || id.includes('gym')) return REAL_RENDERS['treadmill'];
    if (id.includes('patio') || id.includes('garden chair')) return REAL_RENDERS['outdoor-chair'];
    
    if (id.includes('box') || id.includes('carton') || id.includes('packaging')) return REAL_RENDERS['generic-box'];

    // 4. Priority check for tables before seats to prevent "Patio Table" showing a sofa
    if (id.includes('table') && !id.includes('tv') && !id.includes('lamp') && !id.includes('stand')) return REAL_RENDERS['table'] || localPath;
    
    if (id.includes('sofa') || id.includes('seater') || (id.includes('couch') && !id.includes('table'))) return REAL_RENDERS['sofa'] || localPath;
    if (id.includes('bed')) return REAL_RENDERS['bed'] || localPath;

    // 3. High-res 3D Fluency for realistic rendered object look (Dynamic fallback)
    if (id.includes('wardrobe carton')) return REAL_RENDERS['carton']; // Specific check for wardrobe box
    if (id.includes('fridge') || id.includes('refrigerator')) return REAL_RENDERS['fridge'];
    if (id.includes('tv')) return REAL_RENDERS['tv'];
    if (id.includes('washing-machine') || id.includes('laundry')) return REAL_RENDERS['washing-machine'];
    if (id.includes('wardrobe') || id.includes('dresser')) return REAL_RENDERS['wardrobe'];
    if (id.includes('desk')) return REAL_RENDERS['desk'];
    if (id.includes('chair')) return REAL_RENDERS['chair'];
    if (id.includes('shelf') || id.includes('bookcase')) return REAL_RENDERS['shelf'];
    if (id.includes('lamp')) return REAL_RENDERS['lamp'];
    if (id.includes('golf cart')) return REAL_RENDERS['golf-cart'];
    if (id.includes('motorbike') || id.includes('motorcycle')) return REAL_RENDERS['motorbike'];
    if (id.includes('dishwasher')) return REAL_RENDERS['dishwasher'];
    if (id.includes('microwave')) return REAL_RENDERS['microwave'];
    if (id.includes('computer') || id.includes('monitor')) return REAL_RENDERS['computer'];
    if (id.includes('gym') || id.includes('treadmill')) return REAL_RENDERS['gym'];
    if (id.includes('box') || id.includes('carton') || id.includes('packaging')) return REAL_RENDERS['carton'];
    if (id.includes('mirror') || id.includes('picture')) return REAL_RENDERS['mirror'];
    if (id.includes('plant') || id.includes('pot')) return REAL_RENDERS['plant'];
    if (id.includes('bicycle')) return REAL_RENDERS['bicycle'];
    if (id.includes('lawnmower')) return REAL_RENDERS['lawnmower'];
    if (id.includes('suitcase') || id.includes('luggage')) return REAL_RENDERS['suitcases'];
    if (id.includes('cabinet') || id.includes('cupboard') || id.includes('sideboard')) return REAL_RENDERS['cabinet'];
    if (id.includes('patio')) return REAL_RENDERS['chair']; // General patio fallback

    // 4. Default to the local path and let onError handle the final fallback
    return localPath;
}

export default function InventoryItemCard({ item, quantity = 0, variation, targetRoom, onAdd, onRemove, onSetQuantity, onToggleModifier, onChangeRoom }) {
    const realisticImage = getInventoryImage(item);
    
    const isGlassOrMarble = variation === 'Glass' || variation === 'Marble'
    const isStandardOrWood = variation === 'Standard Wood/Other' || variation === 'Standard' || variation === 'Wood'
    
    // AUTO-WRAP: Glass/Marble OR items with autoPackagingType === 'Wrapping' (unless Standard Wood selected)
    const isAutoWrapped = isGlassOrMarble || (item.autoPackagingType === 'Wrapping' && !isStandardOrWood)
    const isManuallyWrapped = !isAutoWrapped && Boolean(variation?.includes('Wrapped'))
    const isWrapped = isAutoWrapped || isManuallyWrapped

    // AUTO-SLEEVE: Plastic sleeves apply automatically ONLY to couches, mattresses, and bases (and mutually exclusive with wrapping)
    const cleanVariation = variation ? variation.replace(/_?Plastic Sleeve/g, '').replace(/_?Wrapped/g, '') : null
    const baseIdKey = cleanVariation ? `${item.id}_${cleanVariation}` : item.id
    const isAutoSleeve = !isWrapped && getPlasticSleevesCount(item, baseIdKey) > 0
    const isManuallySleeved = false
    
    const needsPackaging = isWrapped || isAutoSleeve
    const packagingCostPerUnit = needsPackaging ? (item.volume * 35) : 0

    return (
        <div className={clsx(
            "group relative flex flex-col bg-white rounded-3xl border-2 transition-all duration-300",
            quantity > 0 
                ? "border-red-600 shadow-xl shadow-red-100/50 -translate-y-1" 
                : "border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-0.5"
        )}>
            {/* Catalog Hero Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-t-[22px] bg-white p-4">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/30" />
                <img 
                    src={realisticImage} 
                    alt={item.name} 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    style={{ 
                        filter: 'contrast(1.02) brightness(1.02)',
                        mixBlendMode: 'multiply'
                    }}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        // Final fallback to a neutral box render if everything else is missing
                        e.target.src = "https://img.icons8.com/3d-fluency/500/box.png";
                    }}
                />
                
                {/* Active Indicator Overlay */}
                {quantity > 0 && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg border-2 border-white"
                    >
                        {quantity}
                    </motion.div>
                )}

                {/* Logistics Badges */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
                    {item.isHeavy && (
                        <div className="group/heavy relative">
                            <span className="backdrop-blur-md bg-red-600/90 text-white text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-help">
                                <Truck size={10} /> Heavy
                            </span>
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover/heavy:opacity-100 transition-opacity pointer-events-none z-50">
                                This item requires a specialist crew (2 additional members at R700pp).
                            </div>
                        </div>
                    )}
                    {item.requiresCrate && (
                        <span className="backdrop-blur-md bg-amber-500/90 text-white text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">Crate</span>
                    )}
                    {item.requiresPhoto && (
                        <span className="backdrop-blur-md bg-purple-500/90 text-white text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">Photo</span>
                    )}
                </div>
            </div>

            <div className="p-3 md:p-5 flex flex-col flex-1 gap-2 md:gap-4">
                <div className="flex-1">
                    {targetRoom && (
                        <div className="mb-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onChangeRoom) onChangeRoom(item);
                                }}
                                className="w-full flex items-center justify-between gap-1.5 text-[10px] md:text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-red-50/80 border border-slate-200 hover:border-red-200 px-2.5 py-1.5 rounded-xl transition-all group/roombtn cursor-pointer"
                            >
                                <span className="truncate flex items-center gap-1 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                                    <span className="text-slate-400 font-medium text-[9px] uppercase tracking-wider">Room:</span>
                                    <span className="text-slate-900 group-hover/roombtn:text-red-600 font-extrabold truncate">{targetRoom}</span>
                                </span>
                                <span className="text-[9px] font-black text-red-600 bg-white group-hover/roombtn:bg-red-600 group-hover/roombtn:text-white px-2 py-0.5 rounded-md border border-slate-200 group-hover/roombtn:border-red-600 transition-colors flex-shrink-0 uppercase">
                                    Change ▾
                                </span>
                            </button>
                        </div>
                    )}
                    <h4 className="text-xs md:text-base font-bold text-slate-800 leading-tight mb-1 md:mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                        {item.name}
                    </h4>
                    
                    <div className="space-y-1">
                        {(isAutoWrapped || isManuallyWrapped) && (
                            <span className="block text-[9px] md:text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                                🛡 {isAutoWrapped ? 'Auto-Wrapped' : 'Wrapped'}
                            </span>
                        )}
                        {(isAutoSleeve || isManuallySleeved) && (
                            <span className="block text-[9px] md:text-[11px] text-amber-600 font-bold uppercase tracking-wider">
                                🛡 {isAutoSleeve ? 'Auto-Sleeve' : 'Plastic Sleeve'}
                            </span>
                        )}
                        <span className="text-[10px] md:text-xs text-slate-400 font-medium italic">Vol: {item.volume} ft³</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                    {!isAutoWrapped && quantity > 0 && onToggleModifier && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id={`wr-${item.id}`}
                                checked={isManuallyWrapped}
                                onChange={(e) => { e.stopPropagation(); onToggleModifier(item.id, 'Wrapped'); }}
                                className="w-3.5 h-3.5 text-red-600 rounded border-gray-300"
                            />
                            <label htmlFor={`wr-${item.id}`} className="text-[10px] md:text-xs text-slate-500 font-bold cursor-pointer uppercase tracking-tight">
                                Add Wrapping (Vol)
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1 md:gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(item.id, variation); }}
                            className={clsx(
                                "w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center transition-all",
                                quantity > 0 
                                    ? "bg-slate-100 text-slate-500 hover:bg-slate-200" 
                                    : "opacity-0 pointer-events-none"
                            )}
                        >
                            <Minus size={14} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        {quantity > 0 && (
                            <input 
                                type="number"
                                min="0"
                                value={quantity}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    if (onSetQuantity) {
                                        onSetQuantity(item.id, val, variation);
                                    } else {
                                        const diff = val - quantity;
                                        if (diff > 0) {
                                            for (let i = 0; i < diff; i++) onAdd(item.id, variation);
                                        } else if (diff < 0) {
                                            for (let i = 0; i < Math.abs(diff); i++) onRemove(item.id, variation);
                                        }
                                    }
                                }}
                                className="w-10 md:w-12 text-xs md:text-sm font-black text-slate-900 text-center bg-slate-100 border border-slate-200 rounded-lg py-1 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                            />
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(item.id, variation); }}
                        className={clsx(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95",
                            quantity > 0
                                ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
                                : "bg-white border-2 border-slate-100 text-slate-400 hover:border-red-600 hover:text-red-600"
                        )}
                    >
                        <Plus size={20} className="md:w-[24px] md:h-[24px]" />
                    </button>
                </div>
            </div>

        </div>
    )
}
