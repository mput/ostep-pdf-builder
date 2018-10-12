docker-run-dev:
	docker run -v "$(PWD):/code" -it ostep-pdf-builder bash
docker-run-prod:
	docker run -v "$(PWD):/data" -it ostep-pdf-builder
docker-run-prod-bash:
	docker run -v "$(PWD):/data" -it ostep-pdf-builder bash
docker-build:
	docker build -t ostep-pdf-builder .
