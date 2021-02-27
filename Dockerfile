FROM debian:stable-slim

ARG DEBIAN_FRONTEND=noninteractive

# Install and remove chromium (only used to install dependencies)
RUN apt-get update \
        && apt-get install -y --no-install-recommends \
                ca-certificates \
                chromium \
                curl \
                file \
                g++ \
                git \
                gnupg \
                locales \
                make \
                ssh \
                sudo \
                tree \
                uuid-runtime \
                vim \
                wget \
        && dpkg -r --force-depends \
                chromium \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/* \
        && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
        && dpkg-reconfigure locales \
        && update-locale LANG=en_US.UTF-8 \
        && useradd -m -s /bin/bash linuxbrew \
        && echo 'linuxbrew ALL=(ALL) NOPASSWD:ALL' >>/etc/sudoers

USER linuxbrew
WORKDIR /home/linuxbrew
ENV LANG=en_US.UTF-8 \
        PATH=/home/linuxbrew/.npm-packages/bin:/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:$PATH \
        SHELL=/bin/bash

RUN git clone https://github.com/Homebrew/brew /home/linuxbrew/.linuxbrew/Homebrew \
        && mkdir /home/linuxbrew/.linuxbrew/bin \
        && ln -s ../Homebrew/bin/brew /home/linuxbrew/.linuxbrew/bin/ \
        && brew config

RUN brew install \
                hugo \
                jq \
                node \
                sacproj/sac/sac \
                yq \
        && brew cleanup -s \
        && rm -rf $(brew --cache) \
        && rm -rf /home/linuxbrew/.linuxbrew/Homebrew/Library/Taps

RUN mkdir /home/linuxbrew/.npm-packages \
        && npm config set prefix "/home/linuxbrew/.npm-packages" \
        && npm install -g puppeteer \
        && npm cache clean --force
