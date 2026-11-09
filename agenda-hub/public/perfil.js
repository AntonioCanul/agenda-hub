document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar datos del usuario usando la Cookie de sesión
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        // Si el backend responde que no hay usuario (cookie inválida o expirada), redirigimos
        if (!data.usuario) {
            window.location.href = 'login.html';
            return;
        }

        // 2. Llenar los inputs del formulario
        document.getElementById('nombre').value = data.usuario.nombre || '';
        document.getElementById('apellido').value = data.usuario.apellido || '';
        document.getElementById('correo').value = data.usuario.correo || ''; 

        // 3. Actualizar el texto "Mi perfil" de la barra lateral por el nombre real
        const nombreSidebar = document.querySelector('.user-info h2');
        if (nombreSidebar) {
            nombreSidebar.textContent = `${data.usuario.nombre} ${data.usuario.apellido}`;
        }
        
    } catch (error) {
        console.error("Error al cargar perfil:", error);
    }

    // 4. Manejar el guardado del formulario (sin enviar headers de Authorization)
    document.getElementById('perfil-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        
        try {
            const response = await fetch('/api/auth/perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre, apellido })
            });

            if (response.ok) {
                alert('Perfil actualizado correctamente');
                // Actualizar el nombre en la barra lateral sin recargar
                document.querySelector('.user-info h2').textContent = `${nombre} ${apellido}`;
            } else {
                alert('Hubo un error al actualizar');
            }
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    });
});