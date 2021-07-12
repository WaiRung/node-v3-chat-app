const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $meesageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


// Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessage = document.querySelector('#location-message-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOfset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOfset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (welcome) => {
    console.log(welcome.text);
    const html = Mustache.render($messageTemplate, {
        username: welcome.username,
        message: welcome.text,
        createdAt: moment(welcome.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (urlObject) => {
    console.log("url", urlObject);
    const html = Mustache.render($locationMessage, {
        username: urlObject.username,
        url: urlObject.url,
        createdAt: moment(urlObject.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.currentTarget.message.value
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $meesageFormInput.value = ''
        $meesageFormInput.focus()
        if (error) {
            return console.log(error);
        }

        console.log('Message delivered!');
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            (message) => {
                $sendLocationButton.removeAttribute('disabled')
                console.log(message);
            })
    })
})

socket.emit('join', { username, room }, (error => {
    if (error) {
        alert(error)
        location.href = '/'
    }
}))