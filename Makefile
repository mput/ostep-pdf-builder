docker-run-dev:
	docker run -v "$(PWD):/code" -it mput/ostep-pdf-builder bash
docker-run-prod:
	docker run -v "$(PWD):/data" -it mput/ostep-pdf-builder
docker-build:
	docker build -t mput/ostep-pdf-builder .
docker-push:
	docker push mput/ostep-pdf-builder
test:
	./__tests__/testscript.sh
