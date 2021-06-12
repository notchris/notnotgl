export default class Library {
    constructor (emitter) {
        this.objects = []
        this.emitter = emitter;
        this.el = document.querySelector('#library_content')
        return this;
    }

    parseGroups (groups) {
        groups.forEach((group) => {
            const groupEl = document.createElement('details')
            groupEl.classList.add('library_group')

            const groupElTitle = document.createElement('summary')
            groupElTitle.innerText = group.name.replace('GROUP_', '')
            
            const groupElContainer = document.createElement('div')

            groupEl.appendChild(groupElTitle)
            groupEl.appendChild(groupElContainer)

            // Parse children
            group.children.forEach((child) => {

                // Create ui entry
                const childEl = document.createElement('div')
                childEl.classList.add('library_object')

                const img = document.createElement('img')
                img.src = 'https://via.placeholder.com/45'
                
                const label = document.createElement('div')
                label.innerText = child.name

                const btn = document.createElement('button')
                btn.innerText = 'Add'

                childEl.appendChild(img)
                childEl.appendChild(label)
                childEl.appendChild(btn)

                btn.addEventListener('click', () => {
                    this.emitter.emit('addNode', child.name)
                })

                groupElContainer.appendChild(childEl)


                // Add child reference to the library
                this.objects.push(child)
                
            })

            this.el.appendChild(groupEl)



        })
    }
}