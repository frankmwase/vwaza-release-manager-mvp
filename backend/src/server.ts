import { server } from './app';

const start = async () => {
    try {
        const PORT = process.env.PORT || 3000;
        await server.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Server listening at http://localhost:${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
