import { IdeologyCard } from '@/types/game';

// OPERATION BATTALION - Linear Campaign Narrative
// Cards are served in order (no shuffling) to create a connected storyline
// Each card builds on previous decisions, creating an immersive command experience

export const ideologyCards: IdeologyCard[] = [
  // ============================================================================
  // PHASE 1: INFILTRATION (Cards 1-8)
  // The Commander's forces covertly insert behind enemy lines
  // ============================================================================
  {
    id: 'campaign_01',
    question: 'Your dropship lands in enemy territory under cover of darkness. Scout drones detect movement 2 klicks north.',
    optionA: {
      text: 'Go dark. Disable transponders and move silently.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Strike first. Eliminate the patrol before they spot us.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_02',
    question: 'Your advance team discovers an abandoned outpost. Signs indicate recent enemy activity.',
    optionA: {
      text: 'Establish a forward operating base here.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Rig it with surveillance equipment and move on.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_03',
    question: 'Local villagers approach your position. They claim the enemy has been terrorizing their community.',
    optionA: {
      text: 'Promise protection in exchange for intel.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Pay them for information. Credits talk.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_04',
    question: 'Your comms officer intercepts an enemy transmission. They\'re aware of our presence.',
    optionA: {
      text: 'Jam their frequencies. Blind them.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Feed them false intel through the channel.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_05',
    question: 'A supply convoy is passing through the valley below. Lightly defended but carrying valuable cargo.',
    optionA: {
      text: 'Raid it. We need those supplies.',
      resources: { funds: 3, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Let it pass. We can\'t risk exposure.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_06',
    question: 'One of your soldiers is injured. The nearest medical facility is in enemy-held territory.',
    optionA: {
      text: 'Extract them by air. No one gets left behind.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Field treatment only. Mission takes priority.',
      resources: { clout: 2, funds: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_07',
    question: 'Your scouts locate the enemy command bunker. Heavy defenses, but a ventilation shaft offers entry.',
    optionA: {
      text: 'Send a recon team through the shaft.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Mark coordinates for orbital strike.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_08',
    question: 'A defector from enemy ranks seeks asylum. Claims to have critical intelligence.',
    optionA: {
      text: 'Grant asylum. Debrief them immediately.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Could be a trap. Detain and interrogate.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },

  // ============================================================================
  // PHASE 2: ESCALATION (Cards 9-16)
  // Conflict intensifies. Resource management and alliances become critical.
  // ============================================================================
  {
    id: 'campaign_09',
    question: 'The defector\'s intel was real. Enemy reinforcements are inbound - ETA 48 hours.',
    optionA: {
      text: 'Fortify current positions. Dig in.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Strike now before reinforcements arrive.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_10',
    question: 'A rival faction offers alliance against the common enemy. Their methods are... questionable.',
    optionA: {
      text: 'Accept. Enemy of my enemy.',
      resources: { clout: 2, funds: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Refuse. We won\'t compromise our principles.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_11',
    question: 'Our supply lines are stretched thin. Command offers two resupply options.',
    optionA: {
      text: 'Request ammunition and weapons.',
      resources: { clout: 2, funds: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Request medical supplies and rations.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_12',
    question: 'Enemy propaganda broadcasts are demoralizing the local population.',
    optionA: {
      text: 'Jam the broadcasts. Silence them.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Counter with our own broadcast. Win hearts and minds.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_13',
    question: 'Your engineers have captured enemy tech. It could be reverse-engineered or sold.',
    optionA: {
      text: 'Sell it to fund the operation.',
      resources: { funds: 4 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Study it. Knowledge is power.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_14',
    question: 'A civilian hospital is caught in the crossfire. Both sides are using it for cover.',
    optionA: {
      text: 'Evacuate civilians. Declare it neutral ground.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'The enemy made their choice. Take the shot.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_15',
    question: 'Your spy network reports an assassination opportunity. The enemy general will be vulnerable.',
    optionA: {
      text: 'Take the shot. End this quickly.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Capture instead. They\'re more valuable alive.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_16',
    question: 'Local merchants offer black market supplies. Quality is guaranteed, but the source is unknown.',
    optionA: {
      text: 'Pay the premium. Supplies are supplies.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Too risky. Could be enemy plants.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },

  // ============================================================================
  // PHASE 3: SIEGE (Cards 17-24)
  // Major assault on enemy stronghold. High-stakes tactical decisions.
  // ============================================================================
  {
    id: 'campaign_17',
    question: 'The siege begins. Enemy stronghold walls are reinforced. Your artillery is ready.',
    optionA: {
      text: 'Sustained bombardment. Weaken their walls.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Precision strikes on their power grid.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_18',
    question: 'Enemy commander broadcasts an offer. Surrender now and your forces will be spared.',
    optionA: {
      text: 'Respond with artillery. That\'s our answer.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Open negotiations. Stall for time.',
      resources: { media: 2, trust: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_19',
    question: 'Your sappers have breached the outer wall. The inner garrison is mobilizing.',
    optionA: {
      text: 'Press the attack. Momentum is everything.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Hold position. Let them come to us.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_20',
    question: 'Enemy prisoners are slowing your advance. Command wants a decision.',
    optionA: {
      text: 'Secure them in the rear. Geneva protocols apply.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Minimal guard. Combat troops stay on the front.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_21',
    question: 'Your medics are overwhelmed. Triage decisions must be made.',
    optionA: {
      text: 'Prioritize your own troops.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Treat all wounded equally - even enemies.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_22',
    question: 'The inner fortress is nearly breached. Enemy forces are retreating to the command center.',
    optionA: {
      text: 'Cut off their escape routes first.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Leave them an exit. Cornered prey is dangerous.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_23',
    question: 'Victory is within reach, but your troops are exhausted. Command offers stimulants.',
    optionA: {
      text: 'Distribute the stims. One final push.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Rest rotation. We win this properly.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_24',
    question: 'The enemy command center is surrounded. They\'re using human shields.',
    optionA: {
      text: 'Wait them out. Siege tactics.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Collateral damage is inevitable. Move in.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },

  // ============================================================================
  // PHASE 4: ENDGAME (Cards 25-32)
  // Final push. Decisions determine the campaign's outcome.
  // ============================================================================
  {
    id: 'campaign_25',
    question: 'The enemy commander has been captured. They\'re requesting a private audience.',
    optionA: {
      text: 'Grant it. Hear what they have to say.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Deny. They\'re a prisoner, nothing more.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_26',
    question: 'Intel reveals a second enemy force approaching. They\'ll arrive in 12 hours.',
    optionA: {
      text: 'Prepare defensive positions.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Set up an ambush on their approach.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_27',
    question: 'Local leaders want to discuss the future of the region. They seek guarantees.',
    optionA: {
      text: 'Promise self-governance once stability returns.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Install a military administration temporarily.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_28',
    question: 'Your forces discover enemy war crimes evidence. The media wants access.',
    optionA: {
      text: 'Full disclosure. The truth must be known.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Control the narrative. Release what serves us.',
      resources: { media: 2, funds: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_29',
    question: 'The second enemy force has arrived. They\'re offering unconditional surrender.',
    optionA: {
      text: 'Accept and disarm them peacefully.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Demand reparations as part of terms.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_30',
    question: 'Reconstruction begins. Limited resources force a choice.',
    optionA: {
      text: 'Rebuild civilian infrastructure first.',
      resources: { trust: 2, clout: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Secure military installations first.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_31',
    question: 'War correspondents request interviews. Your troops have stories to tell.',
    optionA: {
      text: 'Allow interviews. Heroes deserve recognition.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Operational security first. Limited access.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_32',
    question: 'The campaign ends. Command asks for your assessment of the operation.',
    optionA: {
      text: 'Mission accomplished. Recommend commendations.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Lessons learned. Recommend tactical improvements.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },

  // ============================================================================
  // EPILOGUE / EXTENDED PLAY (Cards 33+)
  // If the game continues beyond the main campaign
  // ============================================================================
  {
    id: 'campaign_33',
    question: 'New orders arrive. Another sector requires stabilization.',
    optionA: {
      text: 'Volunteer your forces. They\'re battle-hardened.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Request rotation. Your troops need rest.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_34',
    question: 'Intelligence reports insurgent activity in the mountains. Cave networks are extensive.',
    optionA: {
      text: 'Deploy mountain warfare specialists.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Establish surveillance. Map their movements.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_35',
    question: 'A weapons cache is discovered. More than your forces can use.',
    optionA: {
      text: 'Distribute to allied militias.',
      resources: { trust: 2, clout: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Sell surplus through approved channels.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_36',
    question: 'Local elections are scheduled. Some candidates have questionable backgrounds.',
    optionA: {
      text: 'Ensure free and fair elections regardless.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Vet candidates for security concerns.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_37',
    question: 'Your best NCO wants to transfer. They\'ve been offered a lucrative private security contract.',
    optionA: {
      text: 'Let them go. They\'ve earned it.',
      resources: { trust: 2, funds: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Deny transfer. Mission needs come first.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_38',
    question: 'A journalist has uncovered some of your more... aggressive tactics.',
    optionA: {
      text: 'Come clean. Transparency builds trust.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Deny and discredit. Protect the operation.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_39',
    question: 'The region is stabilizing. Command discusses long-term presence.',
    optionA: {
      text: 'Recommend permanent garrison.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Train local forces for handover.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_40',
    question: 'Your tour is ending. Command wants a final recommendation for the sector.',
    optionA: {
      text: 'Increase economic investment.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Maintain military presence.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },

  // ============================================================================
  // PHASE 5: NEW THEATER (Cards 41-55)
  // A new conflict zone opens. Fresh challenges await.
  // ============================================================================
  {
    id: 'campaign_41',
    question: 'Orders arrive for a new deployment. Intelligence is limited about the region.',
    optionA: {
      text: 'Request detailed reconnaissance before deployment.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Deploy immediately. Time is critical.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_42',
    question: 'The new theater is a dense urban environment. Civilian presence is high.',
    optionA: {
      text: 'Establish clear rules of engagement prioritizing civilian safety.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Mission success takes priority. Collateral is inevitable.',
      resources: { clout: 2, funds: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_43',
    question: 'Local police force offers to coordinate operations. Their loyalty is uncertain.',
    optionA: {
      text: 'Accept partnership. Build local capacity.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Operate independently. Trust no one.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_44',
    question: 'Your cyber warfare team identifies a vulnerability in enemy communications.',
    optionA: {
      text: 'Exploit it for intelligence gathering.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Shut down their network completely.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_45',
    question: 'A humanitarian convoy requests military escort through hostile territory.',
    optionA: {
      text: 'Provide escort. Protecting civilians is our duty.',
      resources: { trust: 2, clout: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Decline. It exposes our forces unnecessarily.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_46',
    question: 'Enemy snipers are targeting your patrols from apartment buildings.',
    optionA: {
      text: 'Clear buildings systematically. Minimize casualties.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Call in airstrikes. Eliminate the threat.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_47',
    question: 'Local informant network requests additional funding to expand operations.',
    optionA: {
      text: 'Approve the funding. Intel wins wars.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Deny. Can\'t verify their reliability.',
      resources: { trust: 2, clout: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_48',
    question: 'Enemy forces have taken hostages at a government building.',
    optionA: {
      text: 'Negotiate for their release.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Storm the building. Swift action saves lives.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_49',
    question: 'A foreign journalist wants to embed with your unit. Could be good or bad PR.',
    optionA: {
      text: 'Allow it. Transparency builds credibility.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Deny. Operational security is paramount.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_50',
    question: 'Your forces discover an enemy weapons factory hidden in a residential area.',
    optionA: {
      text: 'Evacuate civilians first, then destroy it.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Strike immediately before they can relocate.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_51',
    question: 'Allied special forces request to operate in your sector independently.',
    optionA: {
      text: 'Coordinate operations. Unity is strength.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Allow independence. Less coordination, less leaks.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_52',
    question: 'Local religious leaders request a meeting to discuss peace terms.',
    optionA: {
      text: 'Accept. All paths to peace should be explored.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Decline. They have no authority to negotiate.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_53',
    question: 'Your supply depot was hit. Critical shortages are imminent.',
    optionA: {
      text: 'Request emergency airlift. Cost is secondary.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Requisition from local sources. Improvise.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_54',
    question: 'Enemy commander requests a prisoner exchange.',
    optionA: {
      text: 'Accept. Our people come home.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Decline. We don\'t negotiate with the enemy.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_55',
    question: 'The urban campaign is grinding down. Morale is suffering.',
    optionA: {
      text: 'Rotate troops. Fresh forces, fresh perspective.',
      resources: { trust: 2, funds: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Push through. Victory is near.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },

  // ============================================================================
  // PHASE 6: INSURGENCY (Cards 56-70)
  // Conventional war ends, but insurgency begins.
  // ============================================================================
  {
    id: 'campaign_56',
    question: 'Major combat operations are declared over, but attacks continue. The insurgency begins.',
    optionA: {
      text: 'Shift to counterinsurgency tactics.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Maintain aggressive posture. Crush resistance.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_57',
    question: 'Improvised explosives are targeting your patrols. Casualties are mounting.',
    optionA: {
      text: 'Invest in counter-IED technology.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Increase patrol frequency. Show presence.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_58',
    question: 'Local tribal elders offer an alliance against the insurgents.',
    optionA: {
      text: 'Accept and arm them.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Support without weapons. Political solution.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_59',
    question: 'Insurgent propaganda is spreading on social media. It\'s effective.',
    optionA: {
      text: 'Counter with our own information campaign.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Shut down the platforms. Silence them.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_60',
    question: 'A captured insurgent offers to reveal hideout locations for immunity.',
    optionA: {
      text: 'Grant immunity. The intel is worth it.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'No deals. Justice must be served.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_61',
    question: 'Infrastructure reconstruction funds are available. How to prioritize?',
    optionA: {
      text: 'Schools and hospitals. Win hearts and minds.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Roads and utilities. Economic development.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_62',
    question: 'Night raids are effective but generating civilian complaints.',
    optionA: {
      text: 'Reduce night operations. Community relations matter.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Continue. Tactical advantage is essential.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_63',
    question: 'Local security forces are ready for handover. Or are they?',
    optionA: {
      text: 'Proceed with handover. They need to lead.',
      resources: { trust: 2, funds: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Delay. They need more training.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_64',
    question: 'Drone surveillance footage shows insurgents planting explosives. Civilians nearby.',
    optionA: {
      text: 'Wait for clear shot. Patient targeting.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Strike now. Prevent the attack.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_65',
    question: 'An allied unit is accused of war crimes. Evidence is mounting.',
    optionA: {
      text: 'Full investigation. Justice must be transparent.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Internal review only. Protect the alliance.',
      resources: { clout: 2, funds: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_66',
    question: 'Insurgent leader offers ceasefire negotiations. Could be a trap.',
    optionA: {
      text: 'Accept talks. Every war ends at a table.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Decline. It\'s a delaying tactic.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_67',
    question: 'Your best interpreter is suspected of passing information to insurgents.',
    optionA: {
      text: 'Investigate quietly. Gather evidence.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Immediate detention. Can\'t risk security.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_68',
    question: 'Private military contractors offer additional security support.',
    optionA: {
      text: 'Hire them. We need the manpower.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Decline. Accountability concerns.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_69',
    question: 'Insurgent finances are tracked to a local business network.',
    optionA: {
      text: 'Freeze assets through legal channels.',
      resources: { funds: 2, trust: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Raid and confiscate. Speed matters.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_70',
    question: 'The insurgency is weakening. Key leaders are surrendering.',
    optionA: {
      text: 'Offer amnesty program. Encourage more defections.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'No amnesty. They must face justice.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },

  // ============================================================================
  // PHASE 7: FINAL VICTORY (Cards 71-85)
  // The long campaign approaches its conclusion.
  // ============================================================================
  {
    id: 'campaign_71',
    question: 'Peace negotiations begin. Your input on terms is requested.',
    optionA: {
      text: 'Push for reconciliation. Lasting peace.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Demand unconditional surrender.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_72',
    question: 'Captured enemy files reveal names of collaborators within your ranks.',
    optionA: {
      text: 'Investigate systematically. Due process.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Immediate arrests. Security first.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_73',
    question: 'Victory celebrations are planned. Some question the timing.',
    optionA: {
      text: 'Celebrate. The troops deserve recognition.',
      resources: { trust: 2, media: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Wait. Mission isn\'t complete.',
      resources: { funds: 2, trust: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_74',
    question: 'War tribunals are being established. Your testimony is needed.',
    optionA: {
      text: 'Full cooperation. Justice must be served.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Selective testimony. Protect operational secrets.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_75',
    question: 'Demobilization of enemy forces begins. Some want to join your side.',
    optionA: {
      text: 'Integrate willing fighters. Strength in unity.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Refuse. Too risky.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_76',
    question: 'International observers want access to detention facilities.',
    optionA: {
      text: 'Grant full access. Nothing to hide.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Limited access. Security concerns.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_77',
    question: 'Local government requests your forces remain as advisors.',
    optionA: {
      text: 'Agree to advisory role. Support transition.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Decline. Time for full withdrawal.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_78',
    question: 'Veterans from the campaign are struggling with reintegration.',
    optionA: {
      text: 'Establish support programs. We owe them.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Limited resources. Focus on active forces.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_79',
    question: 'Memorial service planned for fallen comrades. Media wants coverage.',
    optionA: {
      text: 'Allow coverage. Honor their sacrifice publicly.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Private ceremony. Respect for families.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_80',
    question: 'Lessons learned report is due. Some failures should be documented.',
    optionA: {
      text: 'Full transparency. Learn from mistakes.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Classify sensitive failures. Protect reputation.',
      resources: { media: 2, funds: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_81',
    question: 'Foreign investors are interested in post-war reconstruction.',
    optionA: {
      text: 'Welcome investment. Economic recovery is key.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Local ownership first. Build independence.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
  },
  {
    id: 'campaign_82',
    question: 'Former enemies request political participation rights.',
    optionA: {
      text: 'Grant participation. Democracy requires inclusion.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Deny. They haven\'t earned it.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_83',
    question: 'Your forces are being honored with medals. Some recipients are controversial.',
    optionA: {
      text: 'Honor all who served. Bravery is bravery.',
      resources: { trust: 2, clout: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Review recipients. Standards must be upheld.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_84',
    question: 'Documentary filmmakers want to tell the story of the campaign.',
    optionA: {
      text: 'Cooperate fully. History should know.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Limited access. Control the narrative.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_85',
    question: 'Final orders: stand down and return home. Your tour is truly over.',
    optionA: {
      text: 'Depart with ceremony. Honor the journey.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Quiet departure. The mission speaks for itself.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },

  // ============================================================================
  // PHASE 8: LEGACY (Cards 86-100)
  // Extended play - new challenges, new horizons.
  // ============================================================================
  {
    id: 'campaign_86',
    question: 'Years later, a new crisis erupts. Your expertise is requested.',
    optionA: {
      text: 'Return to service. Duty calls.',
      resources: { clout: 2, trust: 1 },
      ideology: 'supremo',
    },
    optionB: {
      text: 'Advise remotely. Training the next generation.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_87',
    question: 'A former ally has become an adversary. Diplomatic channels are failing.',
    optionA: {
      text: 'Seek peaceful resolution. Avoid past mistakes.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Prepare for conflict. Some lessons repeat.',
      resources: { clout: 2, funds: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_88',
    question: 'New technology offers unprecedented surveillance capabilities.',
    optionA: {
      text: 'Deploy responsibly with oversight.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Maximum deployment. Information is power.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_89',
    question: 'Climate disasters are creating security vacuums in unstable regions.',
    optionA: {
      text: 'Humanitarian intervention. Stabilize through aid.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Secure borders. Protect our interests.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_90',
    question: 'Cyber attacks threaten critical infrastructure. Attribution is unclear.',
    optionA: {
      text: 'Strengthen defenses. Focus on protection.',
      resources: { funds: 2, media: 1 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Counter-attack suspected sources.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_91',
    question: 'Autonomous weapons are available for deployment. Ethics are debated.',
    optionA: {
      text: 'Maintain human control. Ethics matter.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Deploy. Tactical advantage is paramount.',
      resources: { clout: 2, media: 1 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_92',
    question: 'Space-based assets are being threatened. New domain, new rules.',
    optionA: {
      text: 'Pursue international treaties. Prevent arms race.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Develop counter-space capabilities.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_93',
    question: 'Disinformation campaigns are destabilizing allied nations.',
    optionA: {
      text: 'Support truth initiatives. Combat lies with facts.',
      resources: { media: 3 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Launch counter-disinformation. Fight fire with fire.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_94',
    question: 'Economic warfare is replacing kinetic conflict. New tools required.',
    optionA: {
      text: 'Invest in economic resilience.',
      resources: { funds: 3 },
      ideology: 'capitalist',
    },
    optionB: {
      text: 'Develop sanctions capabilities.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_95',
    question: 'The next generation of leaders is being trained. What values to emphasize?',
    optionA: {
      text: 'Honor, integrity, and restraint.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Victory, adaptability, and strength.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_96',
    question: 'Your memoirs are requested for publication. Some contents are sensitive.',
    optionA: {
      text: 'Full account. History deserves truth.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Redacted version. Protect sources and methods.',
      resources: { funds: 2, trust: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_97',
    question: 'A crisis erupts that mirrors your first command. Advice is sought.',
    optionA: {
      text: 'Counsel patience and precision.',
      resources: { media: 2, trust: 1 },
      ideology: 'showstopper',
    },
    optionB: {
      text: 'Recommend decisive action.',
      resources: { clout: 3 },
      ideology: 'supremo',
    },
  },
  {
    id: 'campaign_98',
    question: 'Alliance restructuring is proposed. Old partners, new dynamics.',
    optionA: {
      text: 'Strengthen existing bonds.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Pursue new strategic partnerships.',
      resources: { funds: 2, clout: 1 },
      ideology: 'capitalist',
    },
  },
  {
    id: 'campaign_99',
    question: 'Your legacy is being evaluated. Critics and supporters debate.',
    optionA: {
      text: 'Let history judge. Actions speak.',
      resources: { trust: 2, media: 1 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Defend your record. Truth matters.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
  {
    id: 'campaign_100',
    question: 'A new commander takes the helm. Your final words of wisdom?',
    optionA: {
      text: 'Lead with compassion. Strength flows from trust.',
      resources: { trust: 3 },
      ideology: 'idealist',
    },
    optionB: {
      text: 'Lead with resolve. Victory demands sacrifice.',
      resources: { media: 2, clout: 1 },
      ideology: 'showstopper',
    },
  },
];

// Shuffle the deck using Fisher-Yates algorithm
// All storyline cards remain, but are dealt in random order
export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
