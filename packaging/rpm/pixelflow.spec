Name:           pixelflow
Version:        0.1.1
Release:        1%{?dist}
Summary:        Minimal, high-performance media player and video space

License:        MIT
URL:            https://github.com/nightx24/PixelFlow
Source0:        %{name}-%{version}.tar.gz

BuildArch:      x86_64
Requires:       alsa-lib nss libnotify libXScrnSaver

%description
PixelFlow is a modern, minimal video player and media space featuring
intuitive swipe gestures for brightness and volume, Web Audio volume boost up to 200%,
subtitles customization, and seamless folder-based media organization.

%prep
%setup -q

%build
# Built using electron-builder for Fedora RPM target

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT%{_bindir}
mkdir -p $RPM_BUILD_ROOT%{_datadir}/applications
mkdir -p $RPM_BUILD_ROOT%{_datadir}/icons/hicolor/scalable/apps

install -m 755 pixelflow $RPM_BUILD_ROOT%{_bindir}/pixelflow
install -m 644 packaging/flatpak/app.pixelflow.PixelFlow.desktop $RPM_BUILD_ROOT%{_datadir}/applications/pixelflow.desktop
install -m 644 packaging/flatpak/app.pixelflow.PixelFlow.svg $RPM_BUILD_ROOT%{_datadir}/icons/hicolor/scalable/apps/pixelflow.svg

%files
%{_bindir}/pixelflow
%{_datadir}/applications/pixelflow.desktop
%{_datadir}/icons/hicolor/scalable/apps/pixelflow.svg

%changelog
* Sun Oct 11 2026 PixelFlow Contributors <support@pixelflow.app> - 0.1.1-1
- Initial release with React rewrite, gesture HUD, audio boost, and Flatpak/RPM/AppImage/Windows support
