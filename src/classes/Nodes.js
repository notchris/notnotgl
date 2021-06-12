import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three'

export default class Nodes {
    constructor (library, scene) {
        this.library = library
        this.scene = scene
        this.list = []
        this.el = document.querySelector('#nodes_content')
        this.activeNode = null
        return this;
    }

    addNode (name) {
        const obj = this.library.objects.filter((object) => object.name === name)
        if (obj.length) {

            const node = {
                id: uuidv4(),
                label: name,
                object: obj[0].clone(),
                material: {
                    color: '#FF0000',
                    pattern: null,
                    texture: null
                }
            }

            node.object.material = new THREE.MeshStandardMaterial({color: 0xffffff})
            node.object.material.skinning = true
            node.object.material.needsUpdate = true

            this.setupNode(node)
            this.list.push(node)

            this.scene.add(node.object)
            node.object.visible = true



        } else {
            throw new Error('Invalid object from library')
        }
    }

    setupNode (node) {
        const nodeEl = document.createElement('div')
        nodeEl.classList.add('node')
        nodeEl.id = node.id

        const nodeLabel = document.createElement('div')
        nodeLabel.classList.add('label')
        nodeLabel.innerText = node.label

        // Click node label
        nodeLabel.addEventListener('click', (event) => {
            if (event.target.classList.contains('toggle')) return;
            this.selectNode(node, nodeEl)
        })

        // Visibility toggle
        const nodeVisibilityContainer = document.createElement('label');
        nodeVisibilityContainer.classList.add('toggle')


        const nodeVisibilityIcon = document.createElement('i')
        nodeVisibilityIcon.classList.add('mdi')
        nodeVisibilityIcon.classList.add('mdi-eye')

        const nodeVisibility = document.createElement('input')
        nodeVisibility.setAttribute('type', 'checkbox')
        nodeVisibility.setAttribute('checked', true)
        nodeVisibility.addEventListener('input', () => {
            nodeVisibilityIcon.className = ''
            nodeVisibilityIcon.classList.add('mdi')
            node.object.visible = !node.object.visible
            nodeVisibilityIcon.classList.add(node.object.visible ? 'mdi-eye' : 'mdi-eye-off')

        })
        nodeVisibilityContainer.appendChild(nodeVisibility)

        nodeVisibilityContainer.appendChild(nodeVisibilityIcon)


        nodeLabel.appendChild(nodeVisibilityContainer)



        const nodeContent = document.createElement('div')
        nodeContent.classList.add('node_content')

        this.setupStyle(nodeContent, node)
        this.setupParams(nodeContent, node)
        
        nodeEl.appendChild(nodeLabel)
        nodeEl.appendChild(nodeContent)
        

        this.el.appendChild(nodeEl)
    }

    setupStyle (content, node) {

        // Node style
        const styleEl = document.createElement('details')
        styleEl.classList.add('node_style')
        const styleElTitle = document.createElement('summary')
        styleElTitle.innerText = 'Node Style'

        const styleElContent = document.createElement('div')
        this.setupStyleOptions(styleElContent, node)

        styleEl.appendChild(styleElTitle)
        styleEl.appendChild(styleElContent)

        content.appendChild(styleEl)
    }

    setupStyleOptions (content, node) {

        // Color control
        const colorControl = document.createElement('div')
        colorControl.classList.add('color_control')

        const colorControlLabel = document.createElement('div')
        colorControlLabel.innerText = "Color"

        const colorControlInput = document.createElement('input')
        colorControlInput.type = 'color'
        colorControlInput.value = "#FFFFFF"

        colorControlInput.addEventListener('input', (event) => {
            node.material.color = event.target.value
            node.object.material.color.setHex(parseInt(node.material.color.replace(/^#/, ''), 16))
            node.object.material.needsUpdate = true
        })

        colorControl.appendChild(colorControlLabel)
        colorControl.appendChild(colorControlInput)

        // Material control
        const materialControl = document.createElement('div')
        materialControl.classList.add('material_control')

        const materialControlLabel = document.createElement('div')
        materialControlLabel.innerText = "Material"

        const materialControlInput = document.createElement('select')
        const materialOpts = ['Color', 'Gradient', 'Pattern', 'Styles']
        materialOpts.forEach((opt) => {
            const optEl = document.createElement('option')
            optEl.value = opt.toLowerCase()
            optEl.innerText = opt;
            materialControlInput.appendChild(optEl)
            if (opt === 'Color') optEl.setAttribute('selected', true)
        })

        materialControlInput.addEventListener('change', (event) => {
            console.log(event.target.value)
           this.setMaterialType(event.target.value, node)
        })

        materialControl.appendChild(materialControlLabel)
        materialControl.appendChild(materialControlInput)


        // Append control to container
        content.appendChild(materialControl)
        content.appendChild(colorControl)


    }

    setupParams (content, node) {

        // Node Params
        const paramsEl = document.createElement('details')
        paramsEl.classList.add('node_params')
        const paramsElTitle = document.createElement('summary')
        paramsElTitle.innerText = 'Node Params'

        const paramsElContent = document.createElement('div')
        paramsElContent.innerText = 'PARAMS'

        paramsEl.appendChild(paramsElTitle)
        paramsEl.appendChild(paramsElContent)

        content.appendChild(paramsEl)

    }

    setMaterialType (type, node) {
        console.log(node)

        switch (type) {
            case 'color':
                node.object.material = new THREE.MeshStandardMaterial({color: 0xffffff})
                node.object.material.needsUpdate = true
                break;
            case 'gradient':
                let texture = new THREE.Texture(this.generateTexture());
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.needsUpdate = true;
                node.object.material = new THREE.MeshStandardMaterial({color: 0xffffff, map: texture})
                node.object.material.skinning = true
                node.object.material.needsUpdate = true
                break;
            case 'pattern':
                console.log('pattern type');
                break;
            case 'styles':
                break;
            default:
                break;
        }
    }

    generateTexture() {
        const size = 512;

        // create canvas
        let canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        // get context
        let context = canvas.getContext("2d");

        // draw gradient
        context.rect(0, 0, size, size);
        let gradient = context.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, "#FFFFFF"); // light blue
        gradient.addColorStop(1, "#000000"); // dark blue
        context.fillStyle = gradient;
        context.fill();

        return canvas;
    }


    selectNode (node, nodeEl) {
        this.deselectAll()
        if (this.activeNode === node.id) {
            this.activeNode = null
            return;
        }
        this.activeNode = node.id
        nodeEl.classList.add('active')
    } 

    deselectAll () {
        document.querySelectorAll('.node').forEach((el) => {
            el.classList.remove('active')
        })
    }
}