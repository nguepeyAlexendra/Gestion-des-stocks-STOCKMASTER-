import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stockmaster_backend.settings')
django.setup()

from django.contrib.auth.models import User
from stock.models import ProfilUtilisateur

# Trouver l'utilisateur Alexandra
try:
    user = User.objects.get(username='Alexandra')
    print(f"✅ Utilisateur trouvé : {user.username}")
    
    # Créer ou mettre à jour le profil
    profil, created = ProfilUtilisateur.objects.get_or_create(user=user)
    
    if created:
        print(f"✅ Profil créé pour {user.username}")
    else:
        print(f"ℹ️ Profil existant trouvé pour {user.username}")
    
    # Forcer is_admin = True et role = 'admin'
    profil.is_admin = True
    profil.role = 'admin'
    profil.save()
    
    print(f"✅ {user.username} est maintenant ADMIN !")
    print(f"\n📊 Profil mis à jour :")
    print(f"   - Username : {user.username}")
    print(f"   - Email : {user.email}")
    print(f"   - Role : {profil.role}")
    print(f"   - Is Admin : {profil.is_admin}")
    
except User.DoesNotExist:
    print(f"❌ Utilisateur 'Alexandra' introuvable")
except Exception as e:
    print(f"❌ Erreur : {e}")
    import traceback
    traceback.print_exc()