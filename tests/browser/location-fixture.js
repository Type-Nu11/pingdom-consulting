const location = { id: 'synthetic-location', displayName: '합성 장소', address: '합성 주소', roadAddress: '합성 도로', latitude: 37.5, longitude: 127, source: 'search' }
export async function searchNaverLocations() { return [location] }
export async function reverseNaverAddress() { return { ...location, source: 'map' } }
class LatLng { constructor(lat, lng) { this.latitude = lat; this.longitude = lng } lat() { return this.latitude } lng() { return this.longitude } }
class Map { constructor(container) { this.container = container; container.textContent = '합성 지도 SDK' } setOptions() {} setCenter() {} setZoom() {} setSize() {} destroy() { this.container.textContent = '' } }
class Marker { constructor(options) { this.position = options.position } setPosition(position) { this.position = position } getPosition() { return this.position } setMap() {} setDraggable() {} }
export async function loadNaverMaps() { return { LatLng, Map, Marker, Size: class {}, Event: { addListener() {}, clearInstanceListeners() {} } } }
