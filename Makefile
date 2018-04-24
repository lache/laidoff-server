docker-build:
	docker build -t ttl-server .

docker-push:
	docker tag ttl-server lacti/ttl-server
	docker push lacti/ttl-server

docker-pull:
	docker pull lacti/ttl-server
	docker tag lacti/ttl-server ttl-server

docker-run: docker-clean
	docker run -it \
		--name ttl-server \
		-p 3000:3000 \
		-p 3003:3003/udp \
		ttl-server

docker-clean:
	(docker container kill ttl-server || true) && \
		(docker container rm ttl-server || true)

docker-reload: docker-pull docker-run

docker-shell: docker-clean
	docker run -it \
		--name ttl-server \
		-p 3000:3000 \
		-p 3003:3003/udp \
		ttl-server \
		-c /bin/sh

