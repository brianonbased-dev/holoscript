// =============================================================================
// QUANTUM ARENA - Advanced HoloScript+ Showcase
// =============================================================================
// A multiplayer VR combat arena demonstrating high-fidelity HoloScript+:
// - State machines, physics, networking, particles, AI, UI, audio, materials
// - Agent orchestration patterns (P.ORCHESTRATE.*)
// - Observable behaviors (W.PROMPT.OBSERVE.*)
// =============================================================================

meta {
  id: "QUANTUM_ARENA_001"
  name: "Quantum Arena"
  version: "2.0.0"
  author: "Brittney"
  platforms: ["WebXR", "Quest 3", "Vision Pro"]
  maxPlayers: 8
  physics: "rapier3d"
  networking: "websocket-reliable"
}

// === SCENE CONFIGURATION ===
scene QuantumArena {
  environment: {
    skybox: 'nebula_hdri'
    ambientLight: 0.15
    fog: { color: '#1a0a2e', density: 0.02 }
    postProcessing: {
      bloom: { intensity: 0.8, threshold: 0.6 }
      chromaticAberration: 0.003
      vignette: 0.4
    }
  }

  physics: {
    gravity: -9.81
    substeps: 4
    collisionGroups: ['players', 'projectiles', 'environment', 'pickups']
  }

  network: {
    tickRate: 60
    interpolation: true
    predictionWindow: 100
    reconciliationThreshold: 0.1
  }

  // === ARENA STRUCTURE ===
  group ArenaStructure {

    object Floor @collidable {
      geometry: 'plane'
      size: [50, 50]
      material: {
        type: 'pbr'
        albedo: 'textures/hex_grid.png'
        normal: 'textures/hex_grid_normal.png'
        metallic: 0.9
        roughness: 0.2
        emissive: '#4a00e0'
        emissiveIntensity: 0.3
      }

      animation pulse {
        property: 'material.emissiveIntensity'
        keyframes: [
          { time: 0, value: 0.2 }
          { time: 500, value: 0.5 }
          { time: 1000, value: 0.2 }
        ]
        loop: infinite
        easing: 'easeInOutSine'
      }
    }

    object[] ArenaPillars @collidable {
      count: 8
      geometry: 'cylinder'
      radius: 1.5
      height: 15

      distribution: {
        pattern: 'circle'
        radius: 20
        centerY: 7.5
      }

      material: {
        type: 'glass'
        transparency: 0.7
        ior: 1.5
        tint: '#8b5cf6'
      }

      children: {
        particles EnergyCore {
          emitter: 'cylinder'
          emission: { rate: 50 }
          particle: {
            texture: 'energy_particle'
            size: [0.05, 0.15]
            lifetime: [1, 2]
            color: ['#a855f7', '#3b82f6', '#06b6d4']
          }
          physics: {
            velocity: [0, 2, 0]
            turbulence: 0.5
          }
        }
      }
    }

    object[] CoverWalls @collidable {
      count: 12
      geometry: 'box'
      size: [3, 2, 0.3]

      distribution: {
        pattern: 'random'
        bounds: { min: [-18, 1, -18], max: [18, 1, 18] }
        seed: 42
      }

      material: {
        type: 'metal'
        metallic: 0.95
        roughness: 0.1
        color: '#1e1b4b'
      }

      physics: { type: 'static' }
    }
  }

  // === PLAYER SYSTEM ===
  template PlayerAvatar @networked {
    geometry: 'model/player_rig.glb'
    scale: 1.0

    @networked position
    @networked rotation
    @networked health: 100
    @networked shield: 50
    @networked team: null
    @networked state: 'alive'
    @networked equipped: null

    components: {

      controller VRController {
        hands: ['left', 'right']
        haptics: true

        bindings: {
          grab: 'grip'
          fire: 'trigger'
          menu: 'menuButton'
          teleport: 'thumbstick.forward'
          dash: 'thumbstick.click'
        }
      }

      locomotion TeleportDash {
        teleportRange: 10
        dashSpeed: 15
        dashCooldown: 2000
        dashDistance: 5

        validation: "(target) => { return physics.raycast(this.position, target).hit?.tag !== 'outOfBounds' }"
      }

      health HealthSystem {
        max: 100
        regeneration: { rate: 5, delay: 5000 }

        onDamage(amount, source): {
          if (this.shield > 0) {
            let absorbed = Math.min(this.shield, amount * 0.7)
            this.shield -= absorbed
            amount -= absorbed
            particles.spawn('shield_hit', this.position)
          }

          this.health -= amount
          haptics.pulse(source.hand, 0.5, 100)
          audio.play3d('damage_taken', this.position)

          if (this.health <= 0) {
            this.die(source)
          }
        }

        onHeal(amount): {
          this.health = Math.min(this.health + amount, this.max)
          particles.spawn('heal_effect', this.position)
        }
      }
    }

    // Player state machine
    stateMachine PlayerState {
      initial: 'alive'

      states: {
        alive: {
          enter: {
            this.visible = true
            this.collidable = true
          }
          transitions: {
            die: 'dying'
          }
        }

        dying: {
          enter: {
            particles.spawn('death_explosion', this.position)
            audio.play3d('player_death', this.position)
            this.dropEquipped()
          }
          after: 500 -> 'spectating'
        }

        spectating: {
          enter: {
            this.visible = false
            this.collidable = false
            camera.mode = 'freeFly'
            ui.show('spectatorHUD')
          }
          transitions: {
            respawn: 'respawning'
          }
        }

        respawning: {
          enter: {
            let spawn = arena.getSpawnPoint(this.team)
            this.position = spawn.position
            this.health = 100
            this.shield = 50
            particles.spawn('respawn_effect', spawn.position)
          }
          after: 1000 -> 'alive'
        }
      }
    }

    // Visual feedback
    children: {
      object ShieldBubble {
        geometry: 'sphere'
        scale: 1.2
        material: {
          type: 'shader'
          shader: 'shield_fresnel'
          uniforms: {
            shieldStrength: "() => this.shield / 50"
            color: '#3b82f6'
          }
        }
        visible: "() => this.shield > 0"
      }

      ui HealthBar {
        position: [0, 2.2, 0]
        billboard: true
        visible: (viewer) => viewer.id !== this.id

        bar: {
          width: 0.5
          height: 0.06
          current: "() => this.health"
          max: 100
          colors: {
            high: '#22c55e'
            medium: '#eab308'
            low: '#ef4444'
          }
        }
      }

      text PlayerName {
        position: [0, 2.4, 0]
        billboard: true
        content: "() => this.displayName"
        fontSize: 0.08
        color: "() => teams[this.team]?.color || '#ffffff'"
      }
    }
  }

  // === WEAPON SYSTEM ===
  template Weapon @grabbable @networked {
    abstract: true

    @networked owner: null
    @networked ammo: 0
    @networked state: 'idle'

    physics: { mass: 0.8 }

    onGrab(player): {
      if (network.requestOwnership(this)) {
        this.owner = player.id
        player.equipped = this.id
        audio.play3d('weapon_pickup', this.position)
      }
    }

    onRelease: {
      this.owner = null
      if (player.equipped === this.id) {
        player.equipped = null
      }
    }

    stateMachine WeaponState {
      initial: 'idle'

      states: {
        idle: {
          transitions: { fire: 'firing' }
        }
        firing: {
          enter: { this.onFire() }
          after: "() => this.fireRate -> 'cooldown'"
        }
        cooldown: {
          after: "() => this.cooldownTime -> 'idle'"
        }
        reloading: {
          enter: {
            audio.play3d('reload', this.position)
            haptics.pattern(this.owner.hand, 'reload')
          }
          after: "() => this.reloadTime -> 'idle'"
        }
      }
    }
  }

  object PlasmaPistol extends Weapon {
    geometry: 'model/plasma_pistol.glb'

    stats: {
      damage: 15
      fireRate: 200
      cooldownTime: 50
      reloadTime: 1500
      maxAmmo: 20
      projectileSpeed: 50
    }

    ammo: 20

    onFire: {
      if (this.ammo <= 0) {
        this.state = 'reloading'
        return
      }

      this.ammo--

      let projectile = spawn(PlasmaProjectile, {
        position: this.muzzle.worldPosition,
        rotation: this.muzzle.worldRotation,
        velocity: this.muzzle.forward * this.stats.projectileSpeed,
        owner: this.owner,
        damage: this.stats.damage
      })

      particles.spawn('muzzle_flash', this.muzzle.worldPosition)
      audio.play3d('plasma_fire', this.position, { volume: 0.7 })
      haptics.pulse(this.owner.hand, 0.3, 50)
    }

    children: {
      transform muzzle {
        position: [0, 0.05, 0.3]
      }

      light MuzzleGlow {
        type: 'point'
        color: '#00ffff'
        intensity: 0
        range: 3
      }
    }

    animation fireFlash {
      trigger: "'onFire'"
      property: 'MuzzleGlow.intensity'
      keyframes: [
        { time: 0, value: 2 }
        { time: 50, value: 0 }
      ]
    }
  }

  object QuantumRifle extends Weapon {
    geometry: 'model/quantum_rifle.glb'

    stats: {
      damage: 35
      fireRate: 800
      cooldownTime: 100
      reloadTime: 2500
      maxAmmo: 8
      chargeTime: 500
      beamDuration: 100
    }

    ammo: 8
    chargeLevel: 0

    onFire: {
      if (this.ammo <= 0) {
        this.state = 'reloading'
        return
      }

      // Charge mechanic
      if (this.chargeLevel < 1) {
        this.chargeLevel += deltaTime / this.stats.chargeTime
        haptics.continuous(this.owner.hand, this.chargeLevel * 0.5)
        return
      }

      this.ammo--
      this.chargeLevel = 0

      // Hitscan beam
      let hit = physics.raycast(
        this.muzzle.worldPosition,
        this.muzzle.forward,
        {
          maxDistance: 100,
          layers: ['players', 'environment'],
          ignore: [this.owner]
        }
      )

      // Beam visual
      let beam = spawn(QuantumBeam, {
        start: this.muzzle.worldPosition,
        end: hit.point || this.muzzle.worldPosition + this.muzzle.forward * 100,
        duration: this.stats.beamDuration
      })

      if (hit.entity?.health) {
        hit.entity.takeDamage(this.stats.damage, { source: this.owner, type: 'quantum' })
        particles.spawn('quantum_impact', hit.point)
      }

      audio.play3d('quantum_fire', this.position, { volume: 0.9 })
      haptics.pulse(this.owner.hand, 0.8, 150)
    }

    children: {
      transform muzzle {
        position: [0, 0.08, 0.6]
      }

      particles ChargeEffect {
        emitter: 'point'
        position: [0, 0.08, 0.5]
        emission: { rate: "() => this.chargeLevel * 100 "}
        particle: {
          texture: 'quantum_particle'
          size: [0.02, 0.05]
          lifetime: [0.2, 0.5]
          color: ['#a855f7', '#ec4899']
        }
        physics: {
          attraction: { point: [0, 0.08, 0.6], strength: 5 }
        }
      }
    }
  }

  // === PROJECTILES ===
  object PlasmaProjectile @networked {
    geometry: 'sphere'
    scale: 0.08

    material: {
      type: 'emissive'
      color: '#00ffff'
      intensity: 3
    }

    physics: {
      type: 'dynamic'
      mass: 0.01
      collisionGroup: 'projectiles'
      continuous: true
    }

    lifetime: 3000
    owner: null
    damage: 0

    onSpawn: {
      setTimeout(() => this.destroy(), this.lifetime)
    }

    onCollision(other): {
      if (other.id === this.owner) return

      if (other.health) {
        other.takeDamage(this.damage, { source: this.owner, type: 'plasma' })
      }

      particles.spawn('plasma_impact', this.position)
      audio.play3d('plasma_hit', this.position, { volume: 0.5 })
      this.destroy()
    }

    children: {
      light ProjectileGlow {
        type: 'point'
        color: '#00ffff'
        intensity: 1.5
        range: 2
      }

      particles Trail {
        emitter: 'point'
        emission: { rate: 100 }
        particle: {
          texture: 'plasma_trail'
          size: [0.03, 0.08]
          lifetime: [0.1, 0.3]
          color: ['#00ffff', '#0088ff']
        }
        inheritVelocity: -0.5
      }
    }
  }

  // === PICKUP SYSTEM ===
  template Pickup @hoverable @pointable @networked {
    abstract: true

    @networked active: true
    respawnTime: 15000

    animation float {
      property: 'position.y'
      from: 0
      to: 0.3
      duration: 1500
      loop: infinite
      easing: 'easeInOutSine'
    }

    animation spin {
      property: 'rotation.y'
      from: 0
      to: 360
      duration: 3000
      loop: infinite
    }

    onPoint(player): {
      if (!this.active) return

      this.applyEffect(player)
      this.active = false
      this.visible = false

      particles.spawn('pickup_collect', this.position)
      audio.play3d('pickup_sound', this.position)

      setTimeout(() => {
        this.active = true
        this.visible = true
        particles.spawn('pickup_respawn', this.position)
      }, this.respawnTime)
    }

    onHoverEnter: {
      ui.showTooltip(this.tooltipText, this.position)
    }

    onHoverExit: {
      ui.hideTooltip()
    }
  }

  object HealthPack extends Pickup {
    geometry: 'model/health_pack.glb'
    tooltipText: '+50 Health'

    applyEffect(player): {
      player.heal(50)
    }

    children: {
      light HealthGlow {
        type: 'point'
        color: '#22c55e'
        intensity: 1
        range: 3
      }
    }
  }

  object ShieldBoost extends Pickup {
    geometry: 'model/shield_orb.glb'
    tooltipText: '+25 Shield'

    applyEffect(player): {
      player.shield = Math.min(player.shield + 25, 100)
      particles.spawn('shield_boost', player.position)
    }

    children: {
      object ShieldOrb {
        geometry: 'icosphere'
        scale: 0.15
        material: {
          type: 'shader'
          shader: 'hologram'
          uniforms: { color: '#3b82f6', scanSpeed: 2 }
        }
      }
    }
  }

  object QuantumOvercharge extends Pickup {
    geometry: 'model/quantum_core.glb'
    tooltipText: 'QUANTUM OVERCHARGE - 2x Damage for 10s'
    respawnTime: 45000

    applyEffect(player): {
      player.addBuff('quantumOvercharge', {
        duration: 10000,
        damageMultiplier: 2,
        visual: 'quantum_aura'
      })

      audio.playGlobal('powerup_major')
      ui.announce(`${player.displayName} grabbed QUANTUM OVERCHARGE!`)
    }

    children: {
      particles QuantumAura {
        emitter: 'sphere'
        radius: 0.3
        emission: { rate: 80 }
        particle: {
          texture: 'quantum_spark'
          size: [0.02, 0.08]
          lifetime: [0.5, 1.5]
          color: ['#a855f7', '#ec4899', '#f472b6']
        }
      }
    }
  }

  // === SPAWN POINTS ===
  group SpawnPoints {
    object[] TeamASpawns {
      count: 4
      geometry: 'cylinder'
      radius: 1
      height: 0.1
      visible: false

      positions: [
        [-20, 0, -20],
        [-20, 0, -15],
        [-15, 0, -20],
        [-18, 0, -18]
      ]

      tag: 'spawn'
      team: 'alpha'
    }

    object[] TeamBSpawns {
      count: 4
      geometry: 'cylinder'
      radius: 1
      height: 0.1
      visible: false

      positions: [
        [20, 0, 20],
        [20, 0, 15],
        [15, 0, 20],
        [18, 0, 18]
      ]

      tag: 'spawn'
      team: 'beta'
    }
  }

  // === GAME MANAGER ===
  controller GameManager @networked {
    @networked state: 'warmup'
    @networked timeRemaining: 0
    @networked scores: { alpha: 0, beta: 0 }
    @networked round: 1

    config: {
      warmupTime: 30000
      roundTime: 300000
      maxRounds: 3
      scoreToWin: 50
    }

    stateMachine GameState {
      initial: 'warmup'

      states: {
        warmup: {
          enter: {
            this.timeRemaining = this.config.warmupTime
            ui.showAll('warmupOverlay')
            audio.playGlobal('warmup_music', { loop: true })
          }
          tick: {
            this.timeRemaining -= deltaTime
          }
          transitions: {
            timeUp: { when: "() => this.timeRemaining <= 0", to: 'starting' }
          }
        }

        starting: {
          enter: {
            ui.countdown(3)
            audio.stop('warmup_music')
          }
          after: 3000 -> 'playing'
        }

        playing: {
          enter: {
            this.timeRemaining = this.config.roundTime
            audio.playGlobal('round_start')
            this.spawnAllWeapons()
            this.spawnAllPickups()
          }
          tick: {
            this.timeRemaining -= deltaTime
            this.checkWinCondition()
          }
          transitions: {
            timeUp: { when: "() => this.timeRemaining <= 0", to: 'roundEnd' }
            scoreReached: { when: "() => this.checkScoreWin()", to: 'roundEnd' }
          }
        }

        roundEnd: {
          enter: {
            let winner = this.scores.alpha > this.scores.beta ? 'alpha' : 'beta'
            ui.showAll('roundEndOverlay', { winner, scores: this.scores })
            audio.playGlobal('round_end')
          }
          after: 5000 -> {
            if (this.round >= this.config.maxRounds) return 'gameOver'
            this.round++
            return 'starting'
          }
        }

        gameOver: {
          enter: {
            let winner = this.scores.alpha > this.scores.beta ? 'Team Alpha' : 'Team Beta'
            ui.showAll('gameOverOverlay', { winner, finalScores: this.scores })
            audio.playGlobal('victory_fanfare')
          }
        }
      }
    }

    onPlayerKill(killer, victim): {
      if (killer.team) {
        this.scores[killer.team]++
        network.broadcast('scoreUpdate', this.scores)
      }

      ui.killfeed.add({
        killer: killer.displayName,
        victim: victim.displayName,
        weapon: killer.equipped?.name || 'unknown'
      })
    }

    checkScoreWin(): {
      return this.scores.alpha >= this.config.scoreToWin ||
             this.scores.beta >= this.config.scoreToWin
    }
  }

  // === LIGHTING ===
  group Lighting {
    light AmbientFill {
      type: 'ambient'
      color: '#2a1a4a'
      intensity: 0.2
    }

    light MainSpot {
      type: 'spot'
      position: [0, 20, 0]
      target: [0, 0, 0]
      color: '#ffffff'
      intensity: 0.8
      angle: 60
      penumbra: 0.5
      castShadow: true
      shadowMapSize: 2048
    }

    object[] RimLights {
      count: 4
      type: 'point'

      distribution: {
        pattern: 'circle'
        radius: 25
        y: 8
      }

      color: '#8b5cf6'
      intensity: 0.5
      range: 15
    }
  }

  // === AUDIO ===
  audio AmbientDrone {
    source: 'audio/arena_ambience.mp3'
    spatial: false
    volume: 0.3
    loop: true
    autoplay: true
  }

  // === UI OVERLAYS ===
  ui GameHUD {
    anchor: 'screen'
    visible: "() => game.state === 'playing'"

    children: {
      group TopBar {
        position: [0.5, 0.95, 0]
        anchor: 'top-center'

        text Timer {
          content: "() => formatTime(game.timeRemaining)"
          fontSize: 32
          color: '#ffffff'
          font: 'monospace'
        }

        group Scores {
          position: [0, -0.05, 0]

          text AlphaScore {
            position: [-0.15, 0, 0]
            content: "() => `ALPHA: $"{game.scores.alpha}`
            fontSize: 24
            color: '#ef4444'
          }

          text BetaScore {
            position: [0.15, 0, 0]
            content: "() => `BETA: $"{game.scores.beta}`
            fontSize: 24
            color: '#3b82f6'
          }
        }
      }

      group BottomHUD {
        position: [0.5, 0.05, 0]
        anchor: 'bottom-center'

        bar HealthBar {
          width: 200
          height: 20
          current: "() => player.health"
          max: 100
          color: '#22c55e'
          background: '#1f2937'
          borderRadius: 4
        }

        bar ShieldBar {
          position: [0, 25, 0]
          width: 200
          height: 12
          current: "() => player.shield"
          max: 100
          color: '#3b82f6'
          background: '#1f2937'
          borderRadius: 4
        }

        text AmmoCount {
          position: [120, 10, 0]
          content: "() => player.equipped ? `$"{player.equipped.ammo}` : '--'
          fontSize: 28
          color: '#ffffff'
        }
      }

      list Killfeed {
        position: [0.95, 0.8, 0]
        anchor: 'top-right'
        maxItems: 5
        itemDuration: 4000

        itemTemplate: {
          text: (item) => `${item.killer} [${item.weapon}] ${item.victim}`
          fontSize: 14
          color: '#ffffff'
          background: 'rgba(0,0,0,0.5)'
          padding: 8
        }
      }
    }
  }
}

// === HELPER FUNCTIONS ===
function "formatTime" {
  let seconds = Math.floor(ms / 1000)
  let minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// === AGENT HOOKS (for Brittney observation) ===
hooks {
  onSceneLoad: {
    agent.observe('scene_loaded', { scene: 'QuantumArena', timestamp: Date.now() })
  }

  onPlayerJoin(player): {
    agent.observe('player_joined', { playerId: player.id, team: player.team })
  }

  onGameStateChange(oldState, newState): {
    agent.observe('game_state_change', { from: oldState, to: newState })
  }

  onError(error): {
    agent.report('runtime_error', { error: error.message, stack: error.stack })
  }
}