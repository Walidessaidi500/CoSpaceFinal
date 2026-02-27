async function test() {
    try {
        const response = await fetch('http://localhost:8000/api/espacios/1');
        const data = await response.json();
        console.log('Espacio 1 data id_anfitrion:', data.id_anfitrion);
    } catch (e) {
        console.error(e);
    }
}

test();
