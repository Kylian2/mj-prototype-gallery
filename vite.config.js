import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ command }) => {
	const config = {
		base: '/mj-prototype-gallery/',
    	server: {
        	host: '0.0.0.0', 
        	port: 8080
    	}	
	}

	if (command === 'serve') {
		config.server = {
			https: {
				key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
				cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem'))
			},
			host: '0.0.0.0', 
			port: 8080
		}
	}
	return config
})