window.onload = function(){
    const select_elem = document.getElementById('c_city');
    fetch('https://turkiyeapi.dev/api/v1/provinces')
    .then((response) => response.json())
    .then((data) => {
        // console.log(data);
        data.data.forEach(e => {
            // console.log(e.name);
            select_elem.add(new Option(e.name, e.id));
        });
    });
}

function loadDistricts(element) {
    const select_elem = document.getElementById('c_district');
    removeOptions(select_elem);
    fetch(`https://turkiyeapi.dev/api/v1/provinces/${element.value}`)
    .then((response) => response.json())
    .then((data) => {
        // console.log(data);
        data.data.districts.forEach(e => {
            // console.log(e.name);
            select_elem.add(new Option(e.name, e.id));
        });
    });
}

function loadNeighborhoods(element){
    const select_elem = document.getElementById('c_neighborhood');
    removeOptions(select_elem);
    fetch(`https://turkiyeapi.dev/api/v1/districts/${element.value}`)
    .then((response) => response.json())
    .then((data) => {
        // console.log(data);
        data.data.neighborhoods.forEach(e => {
            // console.log(e.name);
            select_elem.add(new Option(e.name, e.id));
        });
    });
}

function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i > 0; i--) {
       selectElement.remove(i);
    }
 }