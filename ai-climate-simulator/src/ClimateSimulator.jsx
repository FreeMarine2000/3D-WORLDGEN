import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const DEFAULT_PROMPT = 'flooded coastal city at night'

const EXAMPLE_PROMPTS = [
  'flooded coastal city at night',
  'stormy mountain village at dusk',
  'sunny desert settlement with dunes',
  'dense rainforest research outpost',
]
const MAP_FILTERS = ['Coastal', 'Cities', 'Storm', 'Forest', 'Night', 'Drylands']

const TERRAIN_OPTIONS = ['coastal', 'city', 'mountain', 'forest', 'desert', 'sandy', 'grassy', 'red-soil', 'dry']
const WEATHER_OPTIONS = ['sunny', 'stormy']
const TIME_OPTIONS = ['day', 'night']

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hashString(value) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seededRandom(seed) {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5
    let temp = value
    temp = Math.imul(temp ^ (temp >>> 15), temp | 1)
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), temp | 61)

    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296
  }
}

function parseJsonFromText(text) {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)

    if (!match) {
      return null
    }

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function deriveFallbackConfig(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  const terrain = lowerPrompt.includes('forest') || lowerPrompt.includes('jungle')
    ? 'forest'
    : lowerPrompt.includes('grassy') || lowerPrompt.includes('grass') || lowerPrompt.includes('meadow')
      ? 'grassy'
      : lowerPrompt.includes('red soil') || lowerPrompt.includes('red-soil') || lowerPrompt.includes('laterite')
        ? 'red-soil'
        : lowerPrompt.includes('dry') || lowerPrompt.includes('arid') || lowerPrompt.includes('rocky') || lowerPrompt.includes('dusty')
          ? 'dry'
          : lowerPrompt.includes('sandy') || lowerPrompt.includes('sand') || lowerPrompt.includes('dune')
            ? 'sandy'
    : lowerPrompt.includes('mountain') || lowerPrompt.includes('hill')
      ? 'mountain'
      : lowerPrompt.includes('desert')
        ? 'desert'
        : lowerPrompt.includes('city') || lowerPrompt.includes('urban')
          ? 'city'
          : 'coastal'

  const time = lowerPrompt.includes('night') || lowerPrompt.includes('dusk') || lowerPrompt.includes('evening')
    ? 'night'
    : 'day'

  const weather = lowerPrompt.includes('storm') || lowerPrompt.includes('rain') || lowerPrompt.includes('fog')
    ? 'stormy'
    : 'sunny'

  const waterLevel = clamp(
    lowerPrompt.includes('flood') || lowerPrompt.includes('flooded') ? 9 : terrain === 'coastal' ? 5 : 2,
    0,
    10,
  )

  return {
    prompt,
    terrain,
    weather,
    time,
    waterLevel,
    vegetation: terrain === 'forest' ? 10 : terrain === 'grassy' ? 9 : terrain === 'mountain' ? 6 : terrain === 'desert' || terrain === 'sandy' || terrain === 'dry' ? 1 : terrain === 'red-soil' ? 4 : 4,
    buildings: terrain === 'city' ? 10 : terrain === 'coastal' ? 7 : terrain === 'dry' ? 1 : 2,
    mood: weather === 'stormy' ? 'dramatic' : 'calm',
  }
}

function normalizeConfig(rawConfig, prompt) {
  const lowerPrompt = prompt.toLowerCase()
  const terrainFromPrompt = lowerPrompt.includes('forest') || lowerPrompt.includes('jungle')
    ? 'forest'
    : lowerPrompt.includes('grassy') || lowerPrompt.includes('grass') || lowerPrompt.includes('meadow')
      ? 'grassy'
      : lowerPrompt.includes('red soil') || lowerPrompt.includes('red-soil') || lowerPrompt.includes('laterite')
        ? 'red-soil'
        : lowerPrompt.includes('dry') || lowerPrompt.includes('arid') || lowerPrompt.includes('rocky') || lowerPrompt.includes('dusty')
          ? 'dry'
          : lowerPrompt.includes('sandy') || lowerPrompt.includes('sand') || lowerPrompt.includes('dune')
            ? 'sandy'
    : lowerPrompt.includes('mountain') || lowerPrompt.includes('hill')
      ? 'mountain'
      : lowerPrompt.includes('desert')
        ? 'desert'
        : lowerPrompt.includes('city') || lowerPrompt.includes('urban')
          ? 'city'
          : 'coastal'

  const terrain = ['coastal', 'city', 'mountain', 'forest', 'desert', 'sandy', 'grassy', 'red-soil', 'dry'].includes(rawConfig?.terrain)
    ? rawConfig.terrain
    : terrainFromPrompt

  const time = rawConfig?.time === 'night' ? 'night' : 'day'
  const weather = rawConfig?.weather === 'stormy' ? 'stormy' : 'sunny'
  const fallback = deriveFallbackConfig(prompt)
  const waterLevel = clamp(Number(rawConfig?.waterLevel ?? fallback.waterLevel), 0, 10)

  return {
    prompt,
    terrain,
    weather,
    time,
    waterLevel,
    vegetation: clamp(Number(rawConfig?.vegetation ?? fallback.vegetation), 0, 10),
    buildings: clamp(Number(rawConfig?.buildings ?? fallback.buildings), 0, 10),
    mood: typeof rawConfig?.mood === 'string' ? rawConfig.mood : fallback.mood,
  }
}

async function requestGeminiConfig(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    return deriveFallbackConfig(prompt)
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: JSON.stringify(
                  {
                    promptText: prompt,
                    creativeBrief: 'Interpret this as a climate world idea for a low-poly scene.',
                    outputStyle: 'compact, plausible, and internally consistent',
                    interpretationHints: [
                      'Infer terrain, weather, and time from cues in the text.',
                      'If uncertain, choose values that best fit overall mood.',
                      'Prefer coherence over literal keyword matching.'
                    ],
                    fallbackMood: 'calm',
                    confidenceMode: 'best-effort'
                  },
                  null,
                  2,
                ),
              },
              {
                text: [
                  'Now, using the above JSON input, produce a compact scene configuration that matches the schema exactly.',
                  'Return only valid JSON with these keys:',
                  "terrain (one of: coastal, city, mountain, forest, desert, sandy, grassy, red-soil, dry)",
                  "weather (one of: sunny, stormy)",
                  "time (one of: day, night)",
                  'waterLevel (number 0-10)',
                  'vegetation (number 0-10)',
                  'buildings (number 0-10)',
                  'mood (short string)',
                ].join('\n'),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    const err = new Error(`Gemini request failed with status ${response.status}`)
    err.status = response.status
    err.body = bodyText
    throw err
  }

  const data = await response.json()
  console.log('Gemini response JSON:', data)
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  const parsed = parseJsonFromText(text)

  if (!parsed) {
    const err = new Error('Gemini returned an unreadable scene config')
    err.status = 502
    throw err
  }

  return normalizeConfig(parsed, prompt)
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial)
    return
  }

  material.dispose()
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0]
    group.remove(child)

    child.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose()
      }

      if (node.material) {
        disposeMaterial(node.material)
      }
    })
  }
}

function skyColorForConfig(config) {
  if (config.time === 'night' && config.weather === 'stormy') {
    return new THREE.Color(0x0b1020)
  }

  if (config.time === 'night') {
    return new THREE.Color(0x10182b)
  }

  if (config.weather === 'stormy') {
    return new THREE.Color(0x54626f)
  }

  return new THREE.Color(0x87c8ff)
}

function groundColorForConfig(config) {
  switch (config.terrain) {
    case 'city':
      return 0x61707f
    case 'mountain':
      return 0x5d5f63
    case 'forest':
      return 0x31593b
    case 'desert':
      return 0xc8a159
    case 'sandy':
      return 0xd9c17f
    case 'grassy':
      return 0x4c8f45
    case 'red-soil':
      return 0xa14b2a
    case 'dry':
      return 0x8d6b4f
    default:
      return 0x386d54
  }
}

function terrainHeightAt(x, z, config, seedValue) {
  const terrainSeed = seedValue * 0.00001
  const waveA = Math.sin((x + terrainSeed * 800) * 0.09) * Math.cos((z - terrainSeed * 600) * 0.08)
  const waveB = Math.sin((x - z) * 0.03 + terrainSeed * 1500) * 0.75
  const ripple = Math.sin((x * 0.16) + terrainSeed * 50) * Math.cos((z * 0.12) - terrainSeed * 60)

  let elevation = waveA * 2.2 + waveB * 1.8 + ripple * 0.9

  if (config.terrain === 'mountain') {
    elevation = Math.max(elevation, 0) * 2.2 + Math.abs(waveA) * 2.5
  }

  if (config.terrain === 'forest') {
    elevation = elevation * 0.8 + Math.sin((x + z) * 0.1) * 0.7
  }

  if (config.terrain === 'grassy') {
    elevation = elevation * 0.7 + Math.sin(x * 0.12) * 0.55 + Math.cos(z * 0.11) * 0.5
  }

  if (config.terrain === 'desert') {
    elevation = elevation * 0.4 + Math.sin(x * 0.05) * 0.6
  }

  if (config.terrain === 'sandy') {
    elevation = elevation * 0.35 + Math.sin((x + z) * 0.06) * 0.75 + Math.cos((x - z) * 0.04) * 0.45
  }

  if (config.terrain === 'red-soil') {
    elevation = elevation * 0.6 + Math.sin(x * 0.09) * 0.8 + Math.cos(z * 0.08) * 0.5
  }

  if (config.terrain === 'dry') {
    elevation = elevation * 0.25 + Math.sin((x * 0.03) + (z * 0.02)) * 0.35
  }

  if (config.terrain === 'city') {
    elevation = elevation * 0.18
  }

  if (config.terrain === 'coastal') {
    const distanceFromCenter = Math.sqrt((x * x) + (z * z)) / 40
    elevation = (elevation * 0.55) - (distanceFromCenter * 3.8)
  }

  return elevation
}

function createTerrain(scene, config, seedValue) {
  const terrainGeometry = new THREE.PlaneGeometry(90, 90, 96, 96)
  terrainGeometry.rotateX(-Math.PI / 2)

  const positionAttribute = terrainGeometry.attributes.position

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const x = positionAttribute.getX(index)
    const z = positionAttribute.getZ(index)
    const height = terrainHeightAt(x, z, config, seedValue)
    positionAttribute.setY(index, height)
  }

  terrainGeometry.computeVertexNormals()

  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: groundColorForConfig(config),
    roughness: 1,
    flatShading: true,
  })

  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  terrain.receiveShadow = true
  scene.add(terrain)

  return terrain
}

function createWater(scene, config, waterState) {
  if (config.waterLevel <= 0) {
    waterState.mesh = null
    waterState.basePositions = null
    waterState.targetLevel = 0
    return null
  }

  const waterGeometry = new THREE.PlaneGeometry(120, 120, 72, 72)
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: config.weather === 'stormy' ? 0x264d78 : 0x2686d1,
    transparent: true,
    opacity: config.terrain === 'coastal' ? 0.72 : 0.48,
    roughness: 0.1,
    metalness: 0.05,
    flatShading: true,
    side: THREE.DoubleSide,
  })

  const water = new THREE.Mesh(waterGeometry, waterMaterial)
  water.rotation.x = -Math.PI / 2
  water.position.y = -4 + (config.waterLevel * 0.9)
  water.userData.basePositions = new Float32Array(waterGeometry.attributes.position.array)
  water.userData.waveStrength = 0.18 + (config.waterLevel * 0.04)
  scene.add(water)

  waterState.mesh = water
  waterState.basePositions = water.userData.basePositions
  waterState.waveStrength = water.userData.waveStrength
  waterState.phase = hashString(`${config.terrain}-${config.weather}-${config.time}`) * 0.00001
  waterState.targetLevel = config.waterLevel

  return water
}

function createBuildings(scene, config, seedValue) {
  if (config.terrain !== 'city' && config.buildings < 4) {
    return null
  }

  const group = new THREE.Group()
  const random = seededRandom(seedValue ^ 0x8c0f11)
  const buildingCount = config.terrain === 'city' ? 42 : 16 + Math.round(config.buildings * 1.8)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: config.time === 'night' ? 0x8d98a6 : 0xb7bec8,
    roughness: 0.95,
    flatShading: true,
  })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: config.time === 'night' ? 0xf4d35e : 0xe9eef7,
    emissive: config.time === 'night' ? 0x201500 : 0x000000,
    roughness: 0.8,
    flatShading: true,
  })
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

  for (let index = 0; index < buildingCount; index += 1) {
    const building = new THREE.Mesh(boxGeometry, index % 3 === 0 ? accentMaterial : baseMaterial)
    const x = (random() - 0.5) * 48
    const z = (random() - 0.5) * 48
    const height = 1.5 + (random() * 8)
    const width = 0.9 + (random() * 1.3)

    building.scale.set(width, height, width)
    building.position.set(x, terrainHeightAt(x, z, config, seedValue) + (height / 2), z)
    group.add(building)
  }

  scene.add(group)
  return group
}

function createVegetation(scene, config, seedValue) {
  if (config.terrain !== 'forest' && config.vegetation < 3) {
    return null
  }

  const group = new THREE.Group()
  const random = seededRandom(seedValue ^ 0x52f3a1)
  const treeCount = config.terrain === 'forest' ? 48 : 12 + Math.round(config.vegetation * 2)
  const trunkGeometry = new THREE.CylinderGeometry(0.14, 0.2, 1.3, 5)
  const canopyGeometry = new THREE.ConeGeometry(0.95, 2.4, 6)
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b402a, flatShading: true })
  const canopyMaterial = new THREE.MeshStandardMaterial({
    color: config.terrain === 'forest' ? 0x2d7d46 : 0x4c9152,
    flatShading: true,
  })

  for (let index = 0; index < treeCount; index += 1) {
    const x = (random() - 0.5) * 52
    const z = (random() - 0.5) * 52
    const trunkHeight = 1 + (random() * 0.8)
    const heightOffset = terrainHeightAt(x, z, config, seedValue)

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.scale.set(0.8 + random() * 0.4, trunkHeight, 0.8 + random() * 0.4)
    trunk.position.set(x, heightOffset + (trunkHeight / 2), z)

    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial)
    canopy.position.set(x, heightOffset + trunkHeight + 1.1, z)
    canopy.rotation.y = random() * Math.PI
    canopy.scale.setScalar(0.8 + random() * 0.9)

    group.add(trunk)
    group.add(canopy)
  }

  scene.add(group)
  return group
}

function createParticles(scene, config, seedValue) {
  if (config.weather !== 'stormy' && config.time !== 'night') {
    return null
  }

  const random = seededRandom(seedValue ^ 0xa3412f)
  const count = config.weather === 'stormy' ? 180 : 90
  const positions = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 110
    positions[index * 3 + 1] = 10 + (random() * 35)
    positions[index * 3 + 2] = (random() - 0.5) * 110
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const particleMaterial = new THREE.PointsMaterial({
    color: config.weather === 'stormy' ? 0xc7d2fe : 0xffffff,
    size: config.weather === 'stormy' ? 0.12 : 0.08,
    transparent: true,
    opacity: config.weather === 'stormy' ? 0.55 : 0.4,
  })

  const particles = new THREE.Points(particleGeometry, particleMaterial)
  scene.add(particles)

  return particles
}

function buildWorld(scene, worldGroup, config, seedValue, waterState) {
  clearGroup(worldGroup)
  waterState.mesh = null
  waterState.basePositions = null
  waterState.targetLevel = config.waterLevel

  const skyColor = skyColorForConfig(config)
  scene.background = skyColor.clone()
  scene.fog = new THREE.Fog(skyColor.clone(), 35, config.weather === 'stormy' ? 118 : 135)

  createTerrain(worldGroup, config, seedValue)
  createWater(worldGroup, config, waterState)
  createBuildings(worldGroup, config, seedValue)
  createVegetation(worldGroup, config, seedValue)
  createParticles(worldGroup, config, seedValue)
}

function ClimateSimulator() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const worldGroupRef = useRef(new THREE.Group())
  const waterStateRef = useRef({ mesh: null, basePositions: null, waveStrength: 0.2, phase: 0 })
  const rateLimitRef = useRef({ attempts: 0 })
  const requestRef = useRef(0)
  const timeRef = useRef(0)
  const [prompt, setPrompt] = useState('')
  const [worldConfig, setWorldConfig] = useState(() => deriveFallbackConfig(DEFAULT_PROMPT))
  const [status, setStatus] = useState('Ready for a new world.')
  const [isGenerating, setIsGenerating] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [dockCollapsed, setDockCollapsed] = useState(false)
  const hasGeminiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY)

  useEffect(() => {
    const mountNode = mountRef.current
    const worldGroup = worldGroupRef.current

    if (!mountNode) {
      return undefined
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, mountNode.clientWidth / mountNode.clientHeight, 0.1, 500)
    camera.position.set(0, 22, 42)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    mountNode.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72)
    scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0xcfe8ff, 0x1b1d26, 0.65)
    scene.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.25)
    directionalLight.position.set(18, 30, 14)
    scene.add(directionalLight)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    scene.add(worldGroup)
    setSceneReady(true)

    const handleResize = () => {
      const width = mountNode.clientWidth
      const height = mountNode.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    const animate = () => {
      requestRef.current = window.requestAnimationFrame(animate)

      const currentScene = sceneRef.current
      const currentCamera = cameraRef.current
      const currentRenderer = rendererRef.current

      if (!currentScene || !currentCamera || !currentRenderer) {
        return
      }

      timeRef.current += 0.01

      const water = waterStateRef.current.mesh
      const waterPositions = water?.geometry?.attributes?.position
      const basePositions = waterStateRef.current.basePositions

      if (water && waterPositions && basePositions) {
        const positions = waterPositions.array
        const waveStrength = waterStateRef.current.waveStrength ?? 0.2
        const phase = waterStateRef.current.phase ?? 0

        for (let index = 0; index < positions.length; index += 3) {
          const x = basePositions[index]
          const y = basePositions[index + 1]
          const z = basePositions[index + 2]
          const ripple = Math.sin((x * 0.18) + timeRef.current * 2.4 + phase) * 0.12
          const swell = Math.cos((z * 0.14) + timeRef.current * 1.7 + phase) * 0.08
          const chop = Math.sin(((x + z) * 0.09) + timeRef.current * 3.2 + phase) * 0.05

          positions[index] = x
          positions[index + 1] = y + ripple + swell + chop + Math.sin(timeRef.current * 1.8 + phase) * 0.03 * waveStrength
          positions[index + 2] = z
        }

        waterPositions.needsUpdate = true
        water.geometry.computeVertexNormals()
        water.rotation.z = Math.sin(timeRef.current * 0.2 + phase) * 0.015
        water.position.y = (-4 + ((waterStateRef.current.targetLevel ?? 0) * 0.9)) + Math.sin(timeRef.current * 1.8 + phase) * 0.12
      }

      currentCamera.position.x = Math.sin(timeRef.current * 0.25) * 32
      currentCamera.position.z = Math.cos(timeRef.current * 0.25) * 32
      currentCamera.lookAt(0, 0, 0)

      currentRenderer.render(currentScene, currentCamera)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.cancelAnimationFrame(requestRef.current)

      clearGroup(worldGroup)
      scene.remove(worldGroup)

      renderer.dispose()

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement)
      }

      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!sceneReady || !sceneRef.current) {
      return
    }

    const seedValue = hashString(`${worldConfig.prompt}-${worldConfig.terrain}-${worldConfig.time}-${worldConfig.weather}`)
    buildWorld(sceneRef.current, worldGroupRef.current, worldConfig, seedValue, waterStateRef.current)
  }, [sceneReady, worldConfig])

  const generateWorldFromPrompt = useCallback(async (promptText, statusLabel = 'World updated from the prompt.') => {
    const trimmedPrompt = promptText.trim()

    if (!trimmedPrompt) {
      setStatus('Enter a climate scene prompt first.')
      return
    }

    setIsGenerating(true)
    setStatus('Gemini is translating the prompt into a world config...')

    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        const config = await requestGeminiConfig(trimmedPrompt)
        setWorldConfig(normalizeConfig(config, trimmedPrompt))
        setStatus(statusLabel)
        rateLimitRef.current.attempts = 0
        break
      } catch (error) {
        if (error && error.status === 429) {
          rateLimitRef.current.attempts += 1

          const cooldownMs = 45000
          setStatus(`Gemini rate limit hit. Cooling down for ${cooldownMs / 1000} s before you can try again.`)

          const fallback = normalizeConfig(deriveFallbackConfig(trimmedPrompt), trimmedPrompt)
          setWorldConfig(fallback)

          setTimeout(() => {
            rateLimitRef.current.attempts = 0
            setStatus('Ready for a new world.')
          }, cooldownMs)

          break // exit retry loop immediately — do NOT retry on 429
        }

        // Non-429 error: use local fallback and stop retrying
        console.error('Gemini request error:', error)
        const fallback = normalizeConfig(deriveFallbackConfig(trimmedPrompt), trimmedPrompt)
        setWorldConfig(fallback)
        setStatus('Gemini was unavailable — generated a local world instead.')
        break
      }
    }

    setIsGenerating(false)
  }, [])

  async function handleGenerate(event) {
    event?.preventDefault?.()

    await generateWorldFromPrompt(prompt, 'World updated from the prompt.')
  }

  function handleExampleSelect(examplePrompt) {
    setPrompt(examplePrompt)
  }

  function updateWorldField(field, value) {
    setWorldConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        [field]: value,
      }

      if (field === 'terrain' && value === 'city') {
        nextConfig.buildings = Math.max(nextConfig.buildings, 8)
      }

      if (field === 'terrain' && value === 'forest') {
        nextConfig.vegetation = Math.max(nextConfig.vegetation, 7)
      }

      if (field === 'weather' && value === 'stormy') {
        nextConfig.waterLevel = Math.max(nextConfig.waterLevel, 6)
      }

      return normalizeConfig(nextConfig, currentConfig.prompt)
    })
    setStatus('World updated from manual controls.')
  }

  function resetFromPrompt() {
    const fallback = normalizeConfig(deriveFallbackConfig(prompt.trim() || DEFAULT_PROMPT), prompt.trim() || DEFAULT_PROMPT)
    setWorldConfig(fallback)
    setStatus('Reset to the prompt-derived world.')
  }

  return (
    <section className="simulator-page">
      <div className="world-stage">
        <div className="canvas-shell canvas-shell--landscape">
          <div className="canvas-frame" ref={mountRef} aria-label="Three.js climate scene" />
          <div className="canvas-vignette" />
        </div>

        <aside className="map-rail" aria-label="Studio tools">
          <button type="button" className="map-rail__brand" aria-label="AI Climate Simulator">
            <span className="map-rail__brand-mark">AI</span>
          </button>
          <button type="button" className="map-rail__button is-active">
            Build
          </button>
          <button type="button" className="map-rail__button">
            Atlas
          </button>
          <button type="button" className="map-rail__button">
            Notes
          </button>
        </aside>

        <div className="map-topbar">
          <form className="map-search" onSubmit={handleGenerate}>
            <label className="sr-only" htmlFor="prompt-input">
              Search climate world
            </label>
            <input
              id="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={DEFAULT_PROMPT}
            />
            <button type="submit" className="generate-button generate-button--map" disabled={isGenerating}>
              {isGenerating ? 'Loading' : 'Go'}
            </button>
          </form>

          <div className="map-filter-row" aria-label="Prompt filters">
            {MAP_FILTERS.map((filterLabel, index) => (
              <button
                key={filterLabel}
                type="button"
                className="map-filter-chip"
                onClick={() => handleExampleSelect(EXAMPLE_PROMPTS[index % EXAMPLE_PROMPTS.length])}
              >
                {filterLabel}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="dock-toggle dock-toggle--nav"
            onClick={() => setDockCollapsed((currentValue) => !currentValue)}
            aria-expanded={!dockCollapsed}
          >
            {dockCollapsed ? 'Show Controls' : 'Hide Controls'}
          </button>
        </div>

        <aside className={`control-dock${dockCollapsed ? ' is-collapsed' : ''}`}>
          {!dockCollapsed && (
            <>
              <div className="config-panel config-panel--floating }">
                <div>
                  <p className="panel-label">Live scene config</p>
                  <pre>{JSON.stringify(worldConfig, null, 2)}</pre>
                </div>
                <p className="panel-note">
                  Gemini is {hasGeminiKey ? 'connected' : 'not connected'}.
                </p>
              </div>

              <section className="control-card control-card--dock">
                <div className="control-card-header">
                  <div>
                    <p className="panel-label">Scene controls</p>
                    <p className="control-help">Keep the landscape visible while you steer terrain, weather, and density.</p>
                  </div>
                  <button type="button" className="reset-button" onClick={resetFromPrompt}>
                    Reset
                  </button>
                </div>

                <div className="control-grid">
                  <label className="control-field">
                    <span>Terrain</span>
                    <select value={worldConfig.terrain} onChange={(event) => updateWorldField('terrain', event.target.value)}>
                      {TERRAIN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="control-field">
                    <span>Weather</span>
                    <select value={worldConfig.weather} onChange={(event) => updateWorldField('weather', event.target.value)}>
                      {WEATHER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="control-field">
                    <span>Time</span>
                    <select value={worldConfig.time} onChange={(event) => updateWorldField('time', event.target.value)}>
                      {TIME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="control-field">
                    <span>Water {worldConfig.waterLevel.toFixed(1)}</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={worldConfig.waterLevel}
                      onChange={(event) => updateWorldField('waterLevel', Number(event.target.value))}
                    />
                  </label>

                  <label className="control-field">
                    <span>Vegetation {worldConfig.vegetation.toFixed(1)}</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={worldConfig.vegetation}
                      onChange={(event) => updateWorldField('vegetation', Number(event.target.value))}
                    />
                  </label>

                  <label className="control-field">
                    <span>Buildings {worldConfig.buildings.toFixed(1)}</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={worldConfig.buildings}
                      onChange={(event) => updateWorldField('buildings', Number(event.target.value))}
                    />
                  </label>
                </div>

                

                <div className="prompt-actions prompt-actions--dock">
                  <p className="status-text">{status}</p>
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

export default ClimateSimulator
