import "flex-splitter-directive"
import "flex-splitter-directive/styles.min.css"

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import Library from './classes/Library'
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
        this.emitter = new EventEmitter()
        this.library = new Library(this.emitter)
        this.nodes = null
        this.characterModel = null
        this.init()
    }

    init () {
        // renderer
        const {width, height} = this.canvas.getBoundingClientRect()
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        // camera / controls
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
        this.camera.position.set(0, 10, 30)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        // lights
        this.scene.add(new THREE.AmbientLight(0x222222))
        const dirLight = new THREE.DirectionalLight(0xffffff, 1)
        dirLight.position.set(20, 20, 0)
        this.scene.add(dirLight)

        // load base model
        this.loadModel()

        // axes helper
        this.scene.add(new THREE.AxesHelper(20))

        // events
        window.addEventListener('resize', () => this.resize())
        const resizeObserver = new ResizeObserver(() => {
            this.resize()
        })
        resizeObserver.observe(document.querySelector('#renderer'))

        // start render loop
        this.animate()
    }

    loadModel () {
        this.loader.load('./model/rhythm_mmo_chars.glb', (gltf) => {

            // setup character model base
            this.characterModel = gltf.scene.children[0];
            this.characterModel.rotation.y += Math.PI / 2
            let bbox = new THREE.Box3().setFromObject(this.characterModel)
            this.characterModel.position.y -= bbox.max.y / 2
            this.scene.add(this.characterModel)
            
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
            this.nodes = new Nodes(this.library, this.scene)

            // Create base pants and shirt node
            this.nodes.addNode('PANTS_0')
            this.nodes.addNode('TORSO_0')


            this.emitter.on('addNode', (name) => {
                this.nodes.addNode(name)
            })
            
        })
    }

    resize () {
        const {width, height} = this.canvas.getBoundingClientRect()
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height)
    }

    render () {
        this.renderer.render(this.scene, this.camera)
    }

    animate () {
        requestAnimationFrame(() => this.animate())
        this.render()
    }
}

const editor = new Editor()