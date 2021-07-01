import "flex-splitter-directive"
import "flex-splitter-directive/styles.min.css"

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
const intersection = {
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3()
};


import Library from './classes/Library'
import Decals from './classes/Decals'
import Nodes from './classes/Nodes'

import * as EventEmitter from 'eventemitter3'

class Editor {
    constructor () {
        this.canvas = document.querySelector('#renderer')
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.querySelector('#renderer canvas')
        })
        
        this.scene = new THREE.Scene()
        this.loader = new GLTFLoader()
        this.decalLoader = new GLTFLoader()
        this.emitter = new EventEmitter()
        this.library = new Library(this.emitter)
        this.decals = new Decals(this.emitter)
        this.nodes = null
        this.characterModel = null
        this.view = 'edit'
        this.init()

        this.mouse =  new THREE.Vector2(-100, -100)
        this.raycaster = new THREE.Raycaster()

        this.snapping = false

        this.width = 0
        this.height = 0
        this.top = 0
        this.left = 0
    }

    init () {

        this.attireBtn = document.querySelector('#attire')
        this.decalsBtn = document.querySelector('#decals')
        this.attireView = document.querySelector('#library_content')
        this.decalsView = document.querySelector('#decals_content')

        // Toggle Library > Attire
        this.attireBtn.addEventListener('click', () => {
            this.attireView.style.display = 'block'
            this.attireBtn.classList.add('active')
            
            this.decalsView.style.display = 'none'
            this.decalsBtn.classList.remove('active')
        })

        // Toggle Library > Decals
        this.decalsBtn.addEventListener('click', () => {
            this.decalsView.style.display = 'block'
            this.decalsBtn.classList.add('active')
            
            this.attireView.style.display = 'none'
            this.attireBtn.classList.remove('active')
        })

        // renderer
        const {width, height, top, left} = this.canvas.getBoundingClientRect()
        this.width = width
        this.height = height
        this.top = top
        this.left = left

        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        // camera / controls
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
        this.camera.position.set(0, 0, 0.4)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        // lights
        this.scene.add(new THREE.AmbientLight(0x222222))
        const dirLight = new THREE.DirectionalLight(0xffffff, 1)
        dirLight.position.set(20, 20, 0)
        this.scene.add(dirLight)

        // load base model + decals
        this.loadModel()
        this.loadDecals()

        // axes helper
        this.scene.add(new THREE.AxesHelper(20))

        // events
        window.addEventListener('resize', () => this.resize())
        const resizeObserver = new ResizeObserver(() => {
            this.resize()
        })
        resizeObserver.observe(document.querySelector('#renderer'))

        document.querySelector('#renderer').addEventListener('mousemove', (e) => {
            this.mouseMove(e)
        })
        document.querySelector('#renderer').addEventListener('pointerdown', (e) => {
            this.mouseDown(e)
        })

        // start render loop
        this.animate()
    }

    loadDecals () {
        this.loader.load('./model/decals.glb', (gltf) => {
            this.decals.parseDecals(gltf)
        })
    }

    loadModel () {
        this.loader.load('./model/rhythm_mmo_chars_test.glb', (gltf) => {

            // setup character model base
            this.characterModel = gltf.scene.children[0];


            this.characterModel.rotation.y += Math.PI / 2
            this.scene.add(this.characterModel)


            this.characterModel.traverse((child) => {
 
                if (child instanceof THREE.SkinnedMesh) {
                    child.material = new THREE.MeshStandardMaterial({color: 0xCCCCCC})
                    child.geometry.computeBoundsTree();
                    child.pose()
                    
                }
            })
            
            // traverse model groups & hide objects
            const groups = this.characterModel.children.filter((child) => child.name.includes('GROUP'))
            groups.forEach((group) => {
                group.children.forEach((child) => {
                    child.visible = false
                })
            })

            // pass the groups to the library
            this.library.parseGroups(groups)

            // init nodelist with library
            this.nodes = new Nodes(this)

            // Create base pants and shirt node
            this.nodes.addNode('PANTS_0')
            this.nodes.addNode('TORSO_0')

            this.emitter.on('addNode', (name) => {
                this.nodes.addNode(name)
            })
            this.emitter.on('addDecal', (name) => {
                this.nodes.addNode(name)
            })
            
        })
    }

    resize () {
        const {width, height, top, left} = this.canvas.getBoundingClientRect()
        this.width = width
        this.height = height
        this.top = top
        this.left = left

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height)
    }

    mouseMove (e) {
	    this.mouse.x = ((e.clientX - this.left) / this.width) * 2 - 1
	    this.mouse.y = -((e.clientY - this.top) / this.height ) * 2 + 1
    }

    mouseDown () {
        if (this.snapping) {
            this.snapping = false
            document.querySelectorAll('.snapButton').forEach((el) => el.classList.remove('active'))
            console.log('placed item')
        }
    }

    rayCast () {
        if (!this.characterModel) return;

        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.raycaster.firstHitOnly = false;
        const intersects = this.raycaster.intersectObjects(this.characterModel.children, true)
        if (intersects.length) {
            if (this.snapping) {
                //console.log(this.nodes.activeNode)
                const p = intersects[0].point
                const t = this.nodes.list.filter((node) => node.id === this.nodes.activeNode)
                if (t.length) {
                    t[0].object.position.copy(p)
                }
                intersection.point.copy(p)

                const n = intersects[0].face.normal.clone()
                n.transformDirection(intersects[0].object.matrixWorld)
                n.multiplyScalar(10)
                n.add(intersects[0].point)

                intersection.normal.copy(intersects[0].face.normal)
                if (t.length) {
                    t[0].object.lookAt(n)
                }
            }
        }
    }

    render () {
        this.renderer.render(this.scene, this.camera)
    }

    animate () {
        requestAnimationFrame(() => this.animate())
        if (this.raycaster) {
            this.rayCast()
        }
        this.render()
    }
}

const editor = new Editor()