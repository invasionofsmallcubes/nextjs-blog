---
title: 'Writing on NTFS Disk After Update to El Capitan'
date: '2015-12-26'
---

At home I don't have an homogeneous device environment so I keep an NTFS portable hard disk to move around files (for example to watch them on my tv).

After updating my MacBook Pro Late 2011 (yeah, that old and it still rocks hard!), I couldn't find a way to let him write on the NTFS drive. I could mount it, I could read files, but no writing at all.

If you want to spend money, I had for a month the trial period for [Tuxera NTFS](http://www.tuxera.com/products/tuxera-ntfs-for-mac/) and that worked like a charm.

In my case though, I could not accept that an update could crash my Fuse OSX and NTFS-3g setup.

You can find a lot of gists around that have a solution to the problem.

I used this [gist](https://gist.github.com/Coeur/86a18b646a3b78930cf3) but I keep getting problems.

First of all after reinstalling ntfs-3g with `brew` I got the program broken (I don't know how) and I had to relink it again with this command: `brew link --overwrite  homebrew/fuse/ntfs-3g`.

Then I could see the external drive anymore. `diskutil` was not able to mount it anymore but no message was shown. After some digging I tried to mount it via command line with `mount` like this:

```
diskutil list #to get the list of drives
sudo /sbin/mount_ntfs -o rw /dev/disk2s1 ~/temp
```

and it was still failing. When you install ntfs-3g you have errors on `/var/log/mount-ntfs-3g.log`, mine was:

> $MFTMirr does not match $MFT (record 0).
Failed to mount '/dev/disk2s1': Input/output error
NTFS is either inconsistent, or there is a hardware fault, or it's a
SoftRAID/FakeRAID hardware. In the first case run chkdsk /f on Windows
then reboot into Windows twice. The usage of the /f parameter is very
important! If the device is a SoftRAID/FakeRAID then first activate
it and mount a different device under the /dev/mapper/ directory, (e.g.
/dev/mapper/nvidia_eahaabcc1). Please see the 'dmraid' documentation
for more details.

Apparently the hard drive had some problem. Luckily mine was fixable running this command: `sudo ntfsfix /dev/disk2s1`

After that trying to mount it again was a successful operation and I could write again on my NTFS external drive.

A complete explanation of the problem can be found [here](https://wmarkito.wordpress.com/2010/12/29/how-to-fix-mftmirr-does-not-match-mft-record-0/).
