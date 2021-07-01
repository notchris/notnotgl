export default class Decals {
    constructor (emitter) {
        this.objects = []
        this.emitter = emitter;
        this.el = document.querySelector('#decals_content')
        return this;
    }

    parseDecals (gltf) {
        gltf.scene.children[2].children.forEach((child) => {
            child.scale.set(0.01, 0.01, 0.01)
            this.objects.push(child)
            
            const el = document.createElement('div')
            el.classList.add('decal_container')
            
            const label = document.createElement('div')
            label.classList.add('decal_label')
            label.innerText = child.name.replace('DECAL_','')

            const btn = document.createElement('button')
            btn.setAttribute('type', 'button')
            btn.innerText = 'Add'
            btn.addEventListener('click', () => {
                this.emitter.emit('addDecal', child.name)
            })

            el.appendChild(label)
            el.appendChild(btn)

            this.el.appendChild(el)
        })
    }


}