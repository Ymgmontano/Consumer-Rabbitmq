import amqp from 'amqplib';


const rabbitSettings = {
  protocol: 'amqp',
  hostname: '44.195.183.226',
  port: 5672,
  username: 'guest',
  password: 'guest',
};

async function consumeMessages() {
  try {
    const conn = await amqp.connect(rabbitSettings);
    console.log('Conexión exitosa');

    const channel = await conn.createChannel();
    console.log('Canal creado');

    const queue = 'Contacto';

    await channel.assertQueue(queue);
    console.log('Cola creada');

    channel.consume(queue, async (message) => {
      if (message !== null) {
        const messageContent = message.content.toString();
        console.log('Mensaje recibido:', messageContent);
        try {
          const apiUrl = 'http://127.0.0.1:3001/Contact';
          const options = {
            method: 'POST',
            body: messageContent, // Enviar el contenido del mensaje tal como se recibió
            headers: {
              'Content-Type': 'application/json'
            }
          };

          const response = await fetch(apiUrl, options);
          if (response.headers.get('content-type').includes('application/json')) {
            const data = await response.json();
            console.log('Respuesta de la API:', data);
          } else {
            console.error('La respuesta no es JSON:', await response.text());
          }

          // Eliminar el mensaje de la cola una vez procesado
          channel.ack(message);
          console.log('Mensaje eliminado de la cola');
        } catch (error) {
          console.error('Error al hacer la solicitud a la API:', error);
          // Rechazar (rechazar) el mensaje sin volver a encolarlo
          channel.reject(message, false);
          console.log('Error al procesar el mensaje, se elimina de la cola');
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

consumeMessages();