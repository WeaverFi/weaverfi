/* [HEED MY WARNING FELLOW DEV!] This file was auto-generated during build by '/pre-build/projects.js'. Any changes to this file directly will not persist after building. [FARE THEE WELL] */

// Type Imports:
import type { Chain } from './types';

// ARB Project Imports:
import * as arb_aave_v3 from './projects/arb/aave_v3';
import * as arb_beefy from './projects/arb/beefy';
import * as arb_cream from './projects/arb/cream';

// AVAX Project Imports:
import * as avax_aave_v2 from './projects/avax/aave_v2';
import * as avax_aave_v3 from './projects/avax/aave_v3';
import * as avax_alligator from './projects/avax/alligator';
import * as avax_autofarm from './projects/avax/autofarm';
import * as avax_avalaunch from './projects/avax/avalaunch';
import * as avax_axial from './projects/avax/axial';
import * as avax_beefy from './projects/avax/beefy';
import * as avax_benqi from './projects/avax/benqi';
import * as avax_curve from './projects/avax/curve';
import * as avax_lostworlds from './projects/avax/lostworlds';
import * as avax_pangolin from './projects/avax/pangolin';
import * as avax_penguin from './projects/avax/penguin';
import * as avax_platypus from './projects/avax/platypus';
import * as avax_pooltogether_v4 from './projects/avax/pooltogether_v4';
import * as avax_snowball from './projects/avax/snowball';
import * as avax_teddy from './projects/avax/teddy';
import * as avax_traderjoe_v2 from './projects/avax/traderjoe_v2';
import * as avax_traderjoe_v3 from './projects/avax/traderjoe_v3';
import * as avax_yieldyak from './projects/avax/yieldyak';

// BSC Project Imports:
import * as bsc_apeswap from './projects/bsc/apeswap';
import * as bsc_autofarm from './projects/bsc/autofarm';
import * as bsc_beefy from './projects/bsc/beefy';
import * as bsc_belt from './projects/bsc/belt';
import * as bsc_cream from './projects/bsc/cream';
import * as bsc_moonpot from './projects/bsc/moonpot';
import * as bsc_pancakeswap_v1 from './projects/bsc/pancakeswap_v1';
import * as bsc_pancakeswap_v2 from './projects/bsc/pancakeswap_v2';
import * as bsc_venus from './projects/bsc/venus';

// CRONOS Project Imports:
import * as cronos_autofarm from './projects/cronos/autofarm';
import * as cronos_beefy from './projects/cronos/beefy';

// ETH Project Imports:
import * as eth_aave_v2 from './projects/eth/aave_v2';
import * as eth_apwine from './projects/eth/apwine';
import * as eth_balancer from './projects/eth/balancer';
import * as eth_beefy from './projects/eth/beefy';
import * as eth_compound from './projects/eth/compound';
import * as eth_cream from './projects/eth/cream';
import * as eth_curve from './projects/eth/curve';
import * as eth_mstable from './projects/eth/mstable';
import * as eth_pooltogether_v4 from './projects/eth/pooltogether_v4';
import * as eth_sushiswap_v1 from './projects/eth/sushiswap_v1';
import * as eth_sushiswap_v2 from './projects/eth/sushiswap_v2';
import * as eth_yearn from './projects/eth/yearn';

// FTM Project Imports:
import * as ftm_aave_v3 from './projects/ftm/aave_v3';
import * as ftm_autofarm from './projects/ftm/autofarm';
import * as ftm_beefy from './projects/ftm/beefy';
import * as ftm_beethovenx from './projects/ftm/beethovenx';
import * as ftm_bouje from './projects/ftm/bouje';
import * as ftm_cream from './projects/ftm/cream';
import * as ftm_curve from './projects/ftm/curve';
import * as ftm_scream from './projects/ftm/scream';
import * as ftm_spookyswap from './projects/ftm/spookyswap';

// OP Project Imports:
import * as op_aave_v3 from './projects/op/aave_v3';
import * as op_beefy from './projects/op/beefy';
import * as op_pika from './projects/op/pika';
import * as op_pooltogether_v4 from './projects/op/pooltogether_v4';
import * as op_pooltogether_v5 from './projects/op/pooltogether_v5';

// POLY Project Imports:
import * as poly_aave_v2 from './projects/poly/aave_v2';
import * as poly_aave_v3 from './projects/poly/aave_v3';
import * as poly_apeswap from './projects/poly/apeswap';
import * as poly_apwine from './projects/poly/apwine';
import * as poly_autofarm from './projects/poly/autofarm';
import * as poly_balancer from './projects/poly/balancer';
import * as poly_beefy from './projects/poly/beefy';
import * as poly_cream from './projects/poly/cream';
import * as poly_curve from './projects/poly/curve';
import * as poly_mstable from './projects/poly/mstable';
import * as poly_pooltogether_v4 from './projects/poly/pooltogether_v4';
import * as poly_quickswap from './projects/poly/quickswap';
import * as poly_sushiswap from './projects/poly/sushiswap';

// Projects Record:
const projects: Record<Chain, Record<string, any>> = {
	arb: {
		aave_v3: arb_aave_v3,
		beefy: arb_beefy,
		cream: arb_cream,
	},
	avax: {
		aave_v2: avax_aave_v2,
		aave_v3: avax_aave_v3,
		alligator: avax_alligator,
		autofarm: avax_autofarm,
		avalaunch: avax_avalaunch,
		axial: avax_axial,
		beefy: avax_beefy,
		benqi: avax_benqi,
		curve: avax_curve,
		lostworlds: avax_lostworlds,
		pangolin: avax_pangolin,
		penguin: avax_penguin,
		platypus: avax_platypus,
		pooltogether_v4: avax_pooltogether_v4,
		snowball: avax_snowball,
		teddy: avax_teddy,
		traderjoe_v2: avax_traderjoe_v2,
		traderjoe_v3: avax_traderjoe_v3,
		yieldyak: avax_yieldyak,
	},
	bsc: {
		apeswap: bsc_apeswap,
		autofarm: bsc_autofarm,
		beefy: bsc_beefy,
		belt: bsc_belt,
		cream: bsc_cream,
		moonpot: bsc_moonpot,
		pancakeswap_v1: bsc_pancakeswap_v1,
		pancakeswap_v2: bsc_pancakeswap_v2,
		venus: bsc_venus,
	},
	cronos: {
		autofarm: cronos_autofarm,
		beefy: cronos_beefy,
	},
	eth: {
		aave_v2: eth_aave_v2,
		apwine: eth_apwine,
		balancer: eth_balancer,
		beefy: eth_beefy,
		compound: eth_compound,
		cream: eth_cream,
		curve: eth_curve,
		mstable: eth_mstable,
		pooltogether_v4: eth_pooltogether_v4,
		sushiswap_v1: eth_sushiswap_v1,
		sushiswap_v2: eth_sushiswap_v2,
		yearn: eth_yearn,
	},
	ftm: {
		aave_v3: ftm_aave_v3,
		autofarm: ftm_autofarm,
		beefy: ftm_beefy,
		beethovenx: ftm_beethovenx,
		bouje: ftm_bouje,
		cream: ftm_cream,
		curve: ftm_curve,
		scream: ftm_scream,
		spookyswap: ftm_spookyswap,
	},
	op: {
		aave_v3: op_aave_v3,
		beefy: op_beefy,
		pika: op_pika,
		pooltogether_v4: op_pooltogether_v4,
		pooltogether_v5: op_pooltogether_v5,
	},
	poly: {
		aave_v2: poly_aave_v2,
		aave_v3: poly_aave_v3,
		apeswap: poly_apeswap,
		apwine: poly_apwine,
		autofarm: poly_autofarm,
		balancer: poly_balancer,
		beefy: poly_beefy,
		cream: poly_cream,
		curve: poly_curve,
		mstable: poly_mstable,
		pooltogether_v4: poly_pooltogether_v4,
		quickswap: poly_quickswap,
		sushiswap: poly_sushiswap,
	},
}

export default projects;
