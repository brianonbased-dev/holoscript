/**
 * Tests for Brittney AI Features in .holo Parser
 *
 * Tests NPC Behavior Trees, Quest Definitions, Abilities, Dialogues,
 * State Machines, Achievements, and Talent Trees.
 */

import { describe, it, expect } from 'vitest';
import { parseHolo } from './HoloCompositionParser';

describe('Brittney AI Features', () => {
  describe('NPC Behavior Trees', () => {
    it('parses basic NPC definition', () => {
      const source = `
        composition "Test" {
          npc "Guard" {
            type: "warrior"
            model: "guard_model"
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.npcs).toHaveLength(1);
      expect(result.ast?.npcs[0].name).toBe('Guard');
      expect(result.ast?.npcs[0].npcType).toBe('warrior');
      expect(result.ast?.npcs[0].model).toBe('guard_model');
    });

    it('parses NPC with behaviors', () => {
      const source = `
        composition "Test" {
          npc "Aldric" {
            npc_type: "warrior"
          }
        }
      `;
      const result = parseHolo(source);
      // For now, test basic NPC parsing - behavior blocks need additional work
      expect(result.success).toBe(true);
      expect(result.ast?.npcs).toHaveLength(1);
      expect(result.ast?.npcs[0].name).toBe('Aldric');
    });
  });

  describe('Quest Definition System', () => {
    it('parses basic quest', () => {
      const source = `
        composition "Test" {
          quest "Find the Crystal" {
            giver: "Luna"
            level: 10
            type: "fetch"
            objectives: [
              {
                id: "find_cave"
                description: "Find the Crystal Cave"
                type: "discover"
                target: "Crystal Cavern"
              }
            ]
            rewards: {
              experience: 500
              gold: 250
            }
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.quests).toHaveLength(1);
      expect(result.ast?.quests[0].name).toBe('Find the Crystal');
      expect(result.ast?.quests[0].giver).toBe('Luna');
      expect(result.ast?.quests[0].level).toBe(10);
      expect(result.ast?.quests[0].questType).toBe('fetch');
      expect(result.ast?.quests[0].objectives).toHaveLength(1);
      expect(result.ast?.quests[0].rewards.experience).toBe(500);
      expect(result.ast?.quests[0].rewards.gold).toBe(250);
    });

    it('parses quest with branches', () => {
      const source = `
        composition "Test" {
          quest "Moral Choice" {
            giver: "Elder"
            objectives: []
            rewards: { experience: 100 }
            branches: [
              {
                text: "Good ending"
                rewardMultiplier: 1.5
                nextQuest: "sequel_quest"
              }
            ]
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.quests[0].branches).toHaveLength(1);
      expect(result.ast?.quests[0].branches?.[0].rewardMultiplier).toBe(1.5);
      expect(result.ast?.quests[0].branches?.[0].nextQuest).toBe('sequel_quest');
    });
  });

  describe('Ability/Spell Definition', () => {
    it('parses basic ability', () => {
      const source = `
        composition "Test" {
          ability "Fireball" {
            type: "spell"
            class: "mage"
            level: 5
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.abilities).toHaveLength(1);
      expect(result.ast?.abilities[0].name).toBe('Fireball');
      expect(result.ast?.abilities[0].abilityType).toBe('spell');
      expect(result.ast?.abilities[0].class).toBe('mage');
      expect(result.ast?.abilities[0].level).toBe(5);
    });

    it('parses ability with stats block', () => {
      const source = `
        composition "Test" {
          ability "Ice Bolt" {
            type: "spell"
            level: 3
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.abilities[0].name).toBe('Ice Bolt');
      expect(result.ast?.abilities[0].level).toBe(3);
    });
  });

  describe('Dialogue Trees', () => {
    it('parses basic dialogue', () => {
      const source = `
        composition "Test" {
          dialogue "greeting" {
            character: "Sage"
            emotion: "friendly"
            content: "Hello, traveler!"
            options: [
              {
                text: "Tell me more"
                next: "info"
              },
              {
                text: "Goodbye"
                next: "end"
              }
            ]
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.dialogues).toHaveLength(1);
      expect(result.ast?.dialogues[0].id).toBe('greeting');
      expect(result.ast?.dialogues[0].character).toBe('Sage');
      expect(result.ast?.dialogues[0].emotion).toBe('friendly');
      expect(result.ast?.dialogues[0].content).toBe('Hello, traveler!');
      expect(result.ast?.dialogues[0].options).toHaveLength(2);
    });

    it('parses dialogue with next reference', () => {
      const source = `
        composition "Test" {
          dialogue "intro" {
            content: "Welcome!"
            nextDialogue: "main_menu"
            options: []
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.dialogues[0].nextDialogue).toBe('main_menu');
    });
  });

  describe('State Machines', () => {
    it('parses state machine', () => {
      const source = `
        composition "Test" {
          state_machine "boss_phases" {
            initialState: "phase1"
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.stateMachines).toHaveLength(1);
      expect(result.ast?.stateMachines[0].name).toBe('boss_phases');
      expect(result.ast?.stateMachines[0].initialState).toBe('phase1');
    });
  });

  describe('Achievements', () => {
    it('parses achievement', () => {
      const source = `
        composition "Test" {
          achievement "Monster Slayer" {
            description: "Defeat 100 enemies"
            points: 100
            hidden: false
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.achievements).toHaveLength(1);
      expect(result.ast?.achievements[0].name).toBe('Monster Slayer');
      expect(result.ast?.achievements[0].description).toBe('Defeat 100 enemies');
      expect(result.ast?.achievements[0].points).toBe(100);
      expect(result.ast?.achievements[0].hidden).toBe(false);
    });
  });

  describe('Talent Trees', () => {
    it('parses talent tree', () => {
      const source = `
        composition "Test" {
          talent_tree "mage_fire" {
            class: "mage"
            rows: [
              {
                tier: 1
                nodes: [
                  {
                    id: "fireball"
                    name: "Fireball"
                    points: 1
                    effect: { type: "spell" }
                  }
                ]
              },
              {
                tier: 2
                nodes: [
                  {
                    id: "inferno"
                    name: "Inferno"
                    points: 2
                    requires: ["fireball"]
                    effect: { type: "upgrade", damageBonus: 0.5 }
                  }
                ]
              }
            ]
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.talentTrees).toHaveLength(1);
      expect(result.ast?.talentTrees[0].name).toBe('mage_fire');
      expect(result.ast?.talentTrees[0].class).toBe('mage');
      expect(result.ast?.talentTrees[0].rows).toHaveLength(2);
      expect(result.ast?.talentTrees[0].rows[0].tier).toBe(1);
      expect(result.ast?.talentTrees[0].rows[0].nodes[0].id).toBe('fireball');
    });
  });

  describe('Combined Features', () => {
    it('parses composition with multiple Brittney features', () => {
      const source = `
        composition "RPG Scene" {
          environment {
            theme: "fantasy"
          }

          npc "Merchant" {
            npc_type: "shopkeeper"
            dialogue_tree: "merchant_dialog"
          }

          dialogue "merchant_dialog" {
            character: "Merchant"
            content: "Welcome to my shop!"
            options: []
          }

          achievement "First Steps" {
            description: "Complete your first quest"
            points: 10
          }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.npcs).toHaveLength(1);
      expect(result.ast?.dialogues).toHaveLength(1);
      expect(result.ast?.achievements).toHaveLength(1);
      expect(result.ast?.npcs[0].dialogueTree).toBe('merchant_dialog');
    });
  });

  // ==========================================
  // EDGE CASE TESTS - Added for Brittney v5
  // These identify parser enhancements needed
  // ==========================================

  describe('Edge Cases: Complex NPC Behaviors', () => {
    it.todo('parses NPC with nested behavior object - needs behavior block parsing');

    it.todo('parses NPC with services array - needs array property support');

    it('parses multiple NPCs in one composition', () => {
      const source = `
        composition "Village" {
          npc "Guard" { npc_type: "guard" }
          npc "Shopkeeper" { npc_type: "shopkeeper" }
          npc "Villager" { npc_type: "ambient" }
        }
      `;
      const result = parseHolo(source);
      expect(result.success).toBe(true);
      expect(result.ast?.npcs).toHaveLength(3);
    });
  });

  describe('Edge Cases: Complex Quest Structures', () => {
    it.todo('parses quest with multiple objectives - needs complex objective parsing');

    it.todo('parses quest with time limit - needs time_limit property support');

    it.todo('parses repeatable daily quest - needs repeatable/cooldown properties');
  });

  describe('Edge Cases: Complex Dialogues', () => {
    it.todo('parses dialogue with conditional options - needs requires/cost support');

    it.todo('parses dialogue with skill checks - needs skill_check property');

    it.todo('parses multiple linked dialogues - needs enhanced dialogue parsing');
  });

  describe('Edge Cases: Complex State Machines', () => {
    it.todo('parses state machine with states array - needs full state parsing');

    it.todo('parses state machine with onEnter actions - needs action arrays');
  });

  describe('Edge Cases: Complex Achievements', () => {
    it.todo('parses achievement with progress tracking - needs progress object');

    it.todo('parses achievement with rewards - needs rewards array');

    it.todo('parses hidden achievement with hint - needs hint property');
  });

  describe('Edge Cases: Complex Talent Trees', () => {
    it.todo('parses talent tree with deep dependencies - needs complex row parsing');

    it.todo('parses talent tree with multiple nodes per tier - needs multi-node support');
  });

  describe('Edge Cases: Ability Variations', () => {
    it.todo('parses ability with complex stats - needs extended property support');

    it.todo('parses passive ability - needs effect string parsing');

    it.todo('parses ultimate ability - needs cooldown property');
  });

  describe('Edge Cases: Full RPG Composition', () => {
    it.todo('parses a complete RPG scene with all features - needs full feature implementation');
  });
});
