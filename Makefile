FUNC_NAME := lambda-function-name
ZIP := $(FUNC_NAME).zip
S3_BUCKET := s3-bucket-name
S3_KEY := lambda/$(ZIP)

lambda-build:
	zip -x '*.zip' -x '*.swp' -9 -u -r --exclude='.git/*' --exclude='test/*' $(ZIP) .

lambda-run:
	aws lambda invoke --invocation-type Event --function-name $(FUNC_NAME) --payload "`cat ./data/sample.json`"  /dev/stdout | jq .

lambda-update:
	aws s3 cp $(ZIP) s3://$(S3_BUCKET)/$(S3_KEY)
	aws lambda update-function-code \
		--function-name $(FUNC_NAME) \
		--s3-bucket $(S3_BUCKET) \
		--s3-key $(S3_KEY)

lambda-log:
	aws logs get-log-events \
		--log-group-name "/aws/lambda/$(FUNC_NAME)" \
		--log-stream-name \
		'$(shell aws logs filter-log-events \
			--log-group-name "/aws/lambda/$(FUNC_NAME)" \
			| jq -r .searchedLogStreams[-1].logStreamName)' \
		| jq -r .events[].message

lambda-all:
	make lambda-build
	make lambda-update
	make lambda-run

ffmpeg-install:
	curl -O https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
	tar xvf ffmpeg-release-amd64-static.tar.xz
	cp -f ffmpeg-4.2.1-amd64-static/ffmpeg bin/ffmpeg
	cp -f ffmpeg-4.2.1-amd64-static/ffprobe bin/ffprobe
	rm -f ffmpeg-release-amd64-static.tar.xz
	rm -rf ffmpeg-4.2.1-amd64-static/
