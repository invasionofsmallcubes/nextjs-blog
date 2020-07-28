---
title: 'How to create an octopress docker image and publish it on DockerHub'
date: '2015-12-24'
---
This are my notes about how to configure a docker image and publish it on DockerHub.
It's just a condensed guide but you won't find anything new.

As you know [octopress][faef418d] is a ruby project with some peculiar dependency.
I'm not a ruby developer so I would like not to have that many things on my pc used only for that purpose.

Now, my intention is to use this image as a virtual machine where I can run octopress commands. And that's not
how you usually use a docker image. It's actually really different from the day to day usage but I'm not going
to argue about the fact that I'm not using it in the proper way: you're right and Han shot first. That is not going
to change the fact that we had Episodes 1 2 and 3 and the same goes for how I use docker in this case.

(if you're wondering about the fact that all this ranting was to make a Star Wars reference: right again :P )

When you create a new image you'll describe the way it's configured in a Dockerfile. Let's see mine:

~~~~~~~~
FROM debian:jessie
MAINTAINER Emanuele Ianni <dierre@gmail.com>

ENV BUILD_PACKAGES bash libcurl4-openssl-dev git
ENV RUBY_PACKAGES ruby ruby-dev bundler
ENV EXECJS_DEPENDENCY nodejs
ENV GIT_URL https://github.com/octopress/octopress.git

# Update and install all of the required packages.
# At the end, remove the apk cache
RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install -y $BUILD_PACKAGES
RUN apt-get install -y $RUBY_PACKAGES
RUN apt-get install -y $EXECJS_DEPENDENCY
RUN rm -rf /var/cache/apk/*

# cloning octopress repo and installing version

RUN gem install --no-rdoc --no-ri pry-byebug
RUN gem install --no-rdoc --no-ri octopress-ink
RUN gem install --no-rdoc --no-ri clash
RUN gem install --no-rdoc --no-ri octopress
RUN mkdir octopress
WORKDIR octopress
~~~~~~~~

You can check official documentation to know how to use [docker build](https://docs.docker.com/engine/reference/commandline/build/) and what keys you can user in a [Dockerfile](https://docs.docker.com/engine/reference/builder/).

What I would like to stress about it here is just keep it readable because configuring a docker image could be really complex. You can use `ENV` to set up environment variables that you can use later with `$VARIABLE`.
Remember the difference between `RUN` and `CMD`. `RUN` is used with `docker build` whereas `CMD` is used when you use `docker run`.

In this particular case to build the image (that you can find on [DockerHub](https://hub.docker.com/r/invasionofsmallcubes/octopress/) ) just run `docker build -t octopress .`.

To run it is a little bit trickier than usual but it's doable: `docker run -p 4000:4000 -v /Users/dierre/Projects/octopress/:/octopress -i -t --entrypoint="/bin/bash" invasionofsmallcubes/octropress`.

Here you _expose_ the port 4000 that you will later use to check a preview of your blog, you'll start your docker image opening a console and then you share the content of your octopress repository that in my case is in _/Users/dierre/Projects/octopress/_.

To [tag](https://docs.docker.com/mac/step_six/) a built image you can just follow the official documentation, it's pretty straightforward.

Last note: if you are using OSX then docker will start in a VirtualBox machine named _default_ which has a specific address. You you want to see a preview of the blog, remember to run `jekyll serve --host 0.0.0.0`, where the option `--host 0.0.0.0` is used to open jekyll to answer to every call from everywhere, because the default behaviour is just listen to 127.0.0.1 which is not a viable solution when using docker since you are using the host browser.

I hope it's helpful.

  [faef418d]: https://github.com/octopress/octopress "Octopress Github Repository"
